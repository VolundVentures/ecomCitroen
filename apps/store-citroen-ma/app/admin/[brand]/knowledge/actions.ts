"use server";

// Knowledge-base CRUD + document upload server actions.
// Phase 2: after extracting raw text, the document is chunked and each chunk
// gets embedded with Gemini text-embedding-004 (768 dim). Chunks land in
// `knowledge_chunks` for similarity-search retrieval at chat / voice time
// (Phase 3 wires the actual retrieval into the prompt builder).

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand, KnowledgeBase, KnowledgeDocument } from "@/lib/supabase/database.types";
import { chunkText } from "@/lib/chunking";
import { embedDocuments, toPgVector } from "@/lib/embeddings";

const BUCKET = "knowledge-base";

// Phase 1 supports text-only formats. PDF/DOCX/XLSX get rejected with a
// clear message — they'll be wired in Phase 2 alongside the embed pipeline.
const TEXT_MIMES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);
const PHASE2_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

// Browsers (notably macOS Safari + many Chromium variants) hand back
// `application/octet-stream` or "" for .md / .txt / sometimes .csv when
// the OS hasn't registered a handler. Resolve a real MIME from the file
// extension before validating + uploading — prevents the "mime type
// application/octet-stream is not supported" Storage rejection.
function resolveMimeType(file: File): string {
  const provided = (file.type ?? "").toLowerCase();
  if (provided && provided !== "application/octet-stream") return provided;
  const ext = file.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "";
  switch (ext) {
    case "txt":      return "text/plain";
    case "md":       return "text/markdown";
    case "markdown": return "text/markdown";
    case "csv":      return "text/csv";
    case "json":     return "application/json";
    case "pdf":      return "application/pdf";
    case "docx":     return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xlsx":     return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    default:         return provided || "text/plain";
  }
}

async function brandIdFromSlug(slug: string): Promise<string> {
  const supa = adminClient();
  const { data } = await supa.from("brands").select("id").eq("slug", slug).single();
  const id = (data as unknown as { id?: string } | null)?.id;
  if (!id) throw new Error(`brand not found: ${slug}`);
  return id;
}

/* ─────────────────── Knowledge base CRUD ─────────────────── */

export async function createKnowledgeBase(formData: FormData): Promise<{ id: string }> {
  const brandSlug = String(formData.get("brandSlug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!brandSlug || !name) throw new Error("brandSlug and name are required");

  const supa = adminClient();
  const brand_id = await brandIdFromSlug(brandSlug);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supa.from("knowledge_bases") as any)
    .insert({ brand_id, name, description: description || null })
    .select("id")
    .single();
  if (error) throw new Error(`create KB failed: ${error.message}`);

  revalidatePath(`/admin/${brandSlug}/knowledge`);
  return { id: (data as { id: string }).id };
}

export async function updateKnowledgeBase(formData: FormData): Promise<void> {
  const brandSlug = String(formData.get("brandSlug") ?? "").trim();
  const id = String(formData.get("id") ?? "").trim();
  if (!brandSlug || !id) throw new Error("brandSlug and id are required");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {};
  const name = formData.get("name");
  if (typeof name === "string") update.name = name.trim();
  const description = formData.get("description");
  if (typeof description === "string") update.description = description.trim() || null;
  const topK = formData.get("top_k");
  if (typeof topK === "string" && topK !== "") update.top_k = Number(topK);
  const chunkSize = formData.get("chunk_size");
  if (typeof chunkSize === "string" && chunkSize !== "") update.chunk_size = Number(chunkSize);
  const chunkOverlap = formData.get("chunk_overlap");
  if (typeof chunkOverlap === "string" && chunkOverlap !== "") update.chunk_overlap = Number(chunkOverlap);
  const enabled = formData.get("enabled");
  if (enabled !== null) update.enabled = enabled === "on" || enabled === "true";

  if (Object.keys(update).length === 0) return;

  const supa = adminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supa.from("knowledge_bases") as any).update(update).eq("id", id);
  if (error) throw new Error(`update KB failed: ${error.message}`);

  revalidatePath(`/admin/${brandSlug}/knowledge`);
  revalidatePath(`/admin/${brandSlug}/knowledge/${id}`);
}

export async function deleteKnowledgeBase(formData: FormData): Promise<void> {
  const brandSlug = String(formData.get("brandSlug") ?? "").trim();
  const id = String(formData.get("id") ?? "").trim();
  if (!brandSlug || !id) throw new Error("brandSlug and id are required");

  const supa = adminClient();

  // Delete files from Storage first (otherwise they orphan).
  const { data: docs } = await supa
    .from("knowledge_documents")
    .select("storage_path")
    .eq("kb_id", id);
  const paths = ((docs as unknown as { storage_path: string | null }[] | null) ?? [])
    .map((d) => d.storage_path)
    .filter((p): p is string => !!p);
  if (paths.length > 0) {
    await supa.storage.from(BUCKET).remove(paths);
  }

  // Cascade deletes the documents row via FK.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supa.from("knowledge_bases") as any).delete().eq("id", id);
  if (error) throw new Error(`delete KB failed: ${error.message}`);

  revalidatePath(`/admin/${brandSlug}/knowledge`);
}

/* ─────────────────── Document upload + extraction ─────────────────── */

export async function uploadDocument(formData: FormData): Promise<{ id: string }> {
  const brandSlug = String(formData.get("brandSlug") ?? "").trim();
  const kbId = String(formData.get("kbId") ?? "").trim();
  const file = formData.get("file") as File | null;
  if (!brandSlug || !kbId || !file) throw new Error("brandSlug, kbId, and file are required");

  const mimeType = resolveMimeType(file);

  if (PHASE2_MIMES.has(mimeType)) {
    throw new Error(
      `${mimeType} extraction lands in Phase 2 (alongside the embedding pipeline). For now upload .txt / .md / .csv / .json — copy-paste content from the PDF if you need it today.`
    );
  }
  if (!TEXT_MIMES.has(mimeType) && !file.name.match(/\.(txt|md|markdown|csv|json)$/i)) {
    throw new Error(`Unsupported file type: ${mimeType || file.name}. Phase 1 supports .txt / .md / .csv / .json only.`);
  }

  const supa = adminClient();

  // 1. Create the row first so we have a stable id for the storage path.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: docRow, error: insertErr } = await (supa.from("knowledge_documents") as any)
    .insert({
      kb_id: kbId,
      name: file.name,
      source_type: "file",
      mime_type: mimeType,
      size_bytes: file.size,
      status: "processing",
    })
    .select("id")
    .single();
  if (insertErr || !docRow) throw new Error(`create doc row failed: ${insertErr?.message ?? "no row"}`);
  const docId = (docRow as { id: string }).id;

  const storagePath = `${brandSlug}/${kbId}/${docId}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  // 2. Upload the original file to Storage with the resolved MIME type so the
  //    bucket whitelist accepts it (Storage rejects octet-stream / empty).
  const buf = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await supa.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: mimeType, upsert: true });
  if (uploadErr) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supa.from("knowledge_documents") as any)
      .update({ status: "failed", error_message: `storage upload failed: ${uploadErr.message}` })
      .eq("id", docId);
    throw new Error(`storage upload failed: ${uploadErr.message}`);
  }

  // 3. Extract plain text (Phase 1: just decode UTF-8 — text formats only).
  const rawText = buf.toString("utf-8");

  // 4. Persist raw_text + storage_path immediately so the row is visible in
  //    the admin even if embedding fails. We'll flip status to 'ready' only
  //    after embeddings finish (or 'failed' with the error).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supa.from("knowledge_documents") as any)
    .update({ storage_path: storagePath, raw_text: rawText, error_message: null })
    .eq("id", docId);

  // 5. Chunk + embed (Phase 2). Errors here mark the doc as failed but the
  //    raw text is preserved, so a re-embed can recover.
  try {
    await embedAndStoreChunks({ kbId, docId });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supa.from("knowledge_documents") as any)
      .update({ status: "ready", error_message: null })
      .eq("id", docId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[kb] embed failed for doc ${docId}:`, msg);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supa.from("knowledge_documents") as any)
      .update({ status: "failed", error_message: `embed failed: ${msg.slice(0, 240)}` })
      .eq("id", docId);
    revalidatePath(`/admin/${brandSlug}/knowledge/${kbId}`);
    throw new Error(msg);
  }

  revalidatePath(`/admin/${brandSlug}/knowledge/${kbId}`);
  return { id: docId };
}

/* ─────────────────── Chunk + embed pipeline ─────────────────── */

/** Chunks a document's raw_text using its KB's settings, embeds each chunk
 *  with Gemini, replaces the doc's existing chunks, and inserts the new ones.
 *  Caller is responsible for flipping the doc's `status` afterwards. */
async function embedAndStoreChunks(args: { kbId: string; docId: string }): Promise<{ chunks: number; tokens: number }> {
  const supa = adminClient();

  // Pull the doc (raw_text) and the KB settings together.
  const { data: docRow, error: docErr } = await supa
    .from("knowledge_documents")
    .select("id, raw_text")
    .eq("id", args.docId)
    .single();
  if (docErr || !docRow) throw new Error(`load doc failed: ${docErr?.message ?? "no row"}`);
  const raw = (docRow as unknown as { raw_text: string | null }).raw_text ?? "";
  if (!raw.trim()) {
    // Nothing to embed — clean up old chunks and exit (treat as ready).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supa.from("knowledge_chunks") as any).delete().eq("document_id", args.docId);
    return { chunks: 0, tokens: 0 };
  }

  const { data: kbRow, error: kbErr } = await supa
    .from("knowledge_bases")
    .select("chunk_size, chunk_overlap")
    .eq("id", args.kbId)
    .single();
  if (kbErr || !kbRow) throw new Error(`load KB settings failed: ${kbErr?.message ?? "no row"}`);
  const { chunk_size, chunk_overlap } = kbRow as unknown as { chunk_size: number; chunk_overlap: number };

  // Mark processing so the UI shows the right status during the embed call.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supa.from("knowledge_documents") as any).update({ status: "processing" }).eq("id", args.docId);

  // Chunk.
  const chunks = chunkText(raw, chunk_size, chunk_overlap);
  if (chunks.length === 0) return { chunks: 0, tokens: 0 };

  // Embed (Gemini batch).
  const embeddings = await embedDocuments(chunks.map((c) => c.content));

  // Replace existing chunks atomically-ish (delete then insert).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supa.from("knowledge_chunks") as any).delete().eq("document_id", args.docId);

  const rows = chunks.map((c, i) => ({
    document_id: args.docId,
    kb_id:       args.kbId,
    chunk_index: c.index,
    content:     c.content,
    embedding:   toPgVector(embeddings[i]!),
    tokens:      c.tokens,
  }));

  // Insert in batches of 200 to keep request bodies reasonable on large docs.
  for (let i = 0; i < rows.length; i += 200) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supa.from("knowledge_chunks") as any).insert(rows.slice(i, i + 200));
    if (error) throw new Error(`insert chunks failed: ${error.message}`);
  }

  const tokens = chunks.reduce((s, c) => s + c.tokens, 0);
  return { chunks: chunks.length, tokens };
}

/** Re-runs the chunk + embed pipeline for a single document. Useful after
 *  changing the KB's chunk_size / chunk_overlap. */
export async function reEmbedDocument(formData: FormData): Promise<{ chunks: number }> {
  const brandSlug = String(formData.get("brandSlug") ?? "").trim();
  const kbId      = String(formData.get("kbId") ?? "").trim();
  const id        = String(formData.get("id") ?? "").trim();
  if (!brandSlug || !kbId || !id) throw new Error("brandSlug, kbId, and id are required");

  const supa = adminClient();
  try {
    const { chunks } = await embedAndStoreChunks({ kbId, docId: id });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supa.from("knowledge_documents") as any)
      .update({ status: "ready", error_message: null })
      .eq("id", id);
    revalidatePath(`/admin/${brandSlug}/knowledge/${kbId}`);
    return { chunks };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supa.from("knowledge_documents") as any)
      .update({ status: "failed", error_message: `embed failed: ${msg.slice(0, 240)}` })
      .eq("id", id);
    revalidatePath(`/admin/${brandSlug}/knowledge/${kbId}`);
    throw new Error(msg);
  }
}

/** Re-embed every document in a KB. Run when chunk settings change or when
 *  upgrading the embedding model. Sequential — Gemini's free tier is 1500
 *  RPM but we stay conservative to avoid noisy 429s. */
export async function reEmbedKnowledgeBase(formData: FormData): Promise<{ documents: number; chunks: number; failed: number }> {
  const brandSlug = String(formData.get("brandSlug") ?? "").trim();
  const kbId      = String(formData.get("kbId") ?? "").trim();
  if (!brandSlug || !kbId) throw new Error("brandSlug and kbId are required");

  const supa = adminClient();
  const { data: docs } = await supa
    .from("knowledge_documents")
    .select("id, raw_text")
    .eq("kb_id", kbId);

  const list = ((docs as unknown as { id: string; raw_text: string | null }[] | null) ?? [])
    .filter((d) => d.raw_text && d.raw_text.trim().length > 0);

  let totalChunks = 0;
  let failed = 0;
  for (const d of list) {
    try {
      const { chunks } = await embedAndStoreChunks({ kbId, docId: d.id });
      totalChunks += chunks;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supa.from("knowledge_documents") as any)
        .update({ status: "ready", error_message: null })
        .eq("id", d.id);
    } catch (err) {
      failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[kb] re-embed doc ${d.id} failed:`, msg);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supa.from("knowledge_documents") as any)
        .update({ status: "failed", error_message: `re-embed failed: ${msg.slice(0, 240)}` })
        .eq("id", d.id);
    }
  }

  revalidatePath(`/admin/${brandSlug}/knowledge/${kbId}`);
  return { documents: list.length, chunks: totalChunks, failed };
}

export async function deleteDocument(formData: FormData): Promise<void> {
  const brandSlug = String(formData.get("brandSlug") ?? "").trim();
  const kbId = String(formData.get("kbId") ?? "").trim();
  const id = String(formData.get("id") ?? "").trim();
  if (!brandSlug || !kbId || !id) throw new Error("brandSlug, kbId, and id are required");

  const supa = adminClient();

  // Best-effort: remove the file from Storage first.
  const { data: doc } = await supa
    .from("knowledge_documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  const path = (doc as unknown as { storage_path: string | null } | null)?.storage_path;
  if (path) {
    await supa.storage.from(BUCKET).remove([path]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supa.from("knowledge_documents") as any).delete().eq("id", id);
  if (error) throw new Error(`delete doc failed: ${error.message}`);

  revalidatePath(`/admin/${brandSlug}/knowledge/${kbId}`);
}

/* ─────────────────── Read helpers (called from server pages) ─────────────────── */

export async function listKnowledgeBases(brandSlug: string): Promise<Array<KnowledgeBase & { document_count: number; total_size_bytes: number; chunk_count: number }>> {
  const supa = adminClient();
  const brand_id = await brandIdFromSlug(brandSlug);

  const { data: kbs } = await supa
    .from("knowledge_bases")
    .select("*")
    .eq("brand_id", brand_id)
    .order("created_at", { ascending: false });

  const list = (kbs as unknown as KnowledgeBase[] | null) ?? [];
  if (list.length === 0) return [];

  const ids = list.map((k) => k.id);

  const [{ data: docs }, { data: chunks }] = await Promise.all([
    supa.from("knowledge_documents").select("kb_id, size_bytes").in("kb_id", ids),
    supa.from("knowledge_chunks").select("kb_id").in("kb_id", ids),
  ]);

  const stats = new Map<string, { count: number; size: number; chunks: number }>();
  for (const d of (docs as unknown as { kb_id: string; size_bytes: number }[] | null) ?? []) {
    const e = stats.get(d.kb_id) ?? { count: 0, size: 0, chunks: 0 };
    e.count += 1;
    e.size  += d.size_bytes ?? 0;
    stats.set(d.kb_id, e);
  }
  for (const c of (chunks as unknown as { kb_id: string }[] | null) ?? []) {
    const e = stats.get(c.kb_id) ?? { count: 0, size: 0, chunks: 0 };
    e.chunks += 1;
    stats.set(c.kb_id, e);
  }

  return list.map((k) => ({
    ...k,
    document_count: stats.get(k.id)?.count ?? 0,
    total_size_bytes: stats.get(k.id)?.size ?? 0,
    chunk_count: stats.get(k.id)?.chunks ?? 0,
  }));
}

export async function getKnowledgeBase(brandSlug: string, id: string): Promise<{
  kb: KnowledgeBase;
  documents: Array<KnowledgeDocument & { chunk_count: number; chunk_tokens: number }>;
} | null> {
  const supa = adminClient();
  const brand_id = await brandIdFromSlug(brandSlug);

  const { data: kbRow } = await supa
    .from("knowledge_bases")
    .select("*")
    .eq("id", id)
    .eq("brand_id", brand_id)
    .maybeSingle();
  const kb = (kbRow as unknown as KnowledgeBase | null) ?? null;
  if (!kb) return null;

  const { data: docs } = await supa
    .from("knowledge_documents")
    .select("*")
    .eq("kb_id", id)
    .order("created_at", { ascending: false });
  const docList = (docs as unknown as KnowledgeDocument[] | null) ?? [];

  // Per-document chunk + token counts (one query, group in JS).
  const docIds = docList.map((d) => d.id);
  const chunkStats = new Map<string, { count: number; tokens: number }>();
  if (docIds.length > 0) {
    const { data: chunks } = await supa
      .from("knowledge_chunks")
      .select("document_id, tokens")
      .in("document_id", docIds);
    for (const c of (chunks as unknown as { document_id: string; tokens: number }[] | null) ?? []) {
      const e = chunkStats.get(c.document_id) ?? { count: 0, tokens: 0 };
      e.count  += 1;
      e.tokens += c.tokens ?? 0;
      chunkStats.set(c.document_id, e);
    }
  }

  const documents = docList.map((d) => ({
    ...d,
    chunk_count:  chunkStats.get(d.id)?.count  ?? 0,
    chunk_tokens: chunkStats.get(d.id)?.tokens ?? 0,
  }));

  return { kb, documents };
}

// Suppress "Brand unused" — exported solely for type-check parity with other actions files.
export type _BrandUnused = Brand;
