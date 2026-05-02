// /admin/[brand]/knowledge — list of knowledge bases for the brand. Mirrors
// the Gallabox "Knowledge Base" pattern: card grid with size + doc count +
// last-updated, plus a "+ Add Knowledge Base" action.

import Link from "next/link";
import { Database, Plus } from "lucide-react";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand } from "@/lib/supabase/database.types";
import { listKnowledgeBases } from "./actions";
import { KnowledgeBaseCreateButton } from "@/components/admin/KnowledgeBaseCreateButton";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (sameDay) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

export default async function KnowledgePage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: slug } = await params;
  const supa = adminClient();
  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = brandRow as unknown as Brand;
  const accent = brand.primary_color ?? "#6366f1";

  const kbs = await listKnowledgeBases(slug);
  const totalBytes = kbs.reduce((s, k) => s + k.total_size_bytes, 0);

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
          <div className="mt-1 text-[12px] text-white/40">
            Manage RAG knowledge bases attached to {brand.name}. Documents land here as raw text — embeddings + retrieval ship in Phase 2 / 3.
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[11px] text-white/55">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Storage used</span>
            <span className="text-white">{formatBytes(totalBytes)}</span>
            <span>/ 1 GB</span>
          </div>
          <KnowledgeBaseCreateButton brandSlug={slug} accent={accent} />
        </div>
      </div>

      {kbs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-20 text-center">
          <Database size={28} className="text-white/30" strokeWidth={1.5} />
          <div className="text-[13px] font-medium text-white/70">No knowledge bases yet</div>
          <div className="max-w-md text-[12px] text-white/40">
            Create your first knowledge base — model spec sheets, financing terms, FAQ docs — to start moving content out of the static system prompt.
          </div>
          <div className="mt-3"><KnowledgeBaseCreateButton brandSlug={slug} accent={accent} /></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kbs.map((kb) => (
            <Link
              key={kb.id}
              href={`/admin/${slug}/knowledge/${kb.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-white/[0.18] hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${accent}1A`, color: accent }}>
                    <Database size={16} strokeWidth={1.7} />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-white">{kb.name}</div>
                    {!kb.enabled && (
                      <div className="mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-white/45 ring-1 ring-white/10">Disabled</div>
                    )}
                  </div>
                </div>
              </div>
              {kb.description && (
                <div className="line-clamp-2 text-[12px] text-white/55">{kb.description}</div>
              )}
              <div className="mt-auto grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-[11px]">
                <div>
                  <div className="text-white/40">Sources</div>
                  <div className="mt-0.5 font-semibold text-white">{kb.document_count}</div>
                </div>
                <div>
                  <div className="text-white/40">Size</div>
                  <div className="mt-0.5 font-semibold text-white">{formatBytes(kb.total_size_bytes)}</div>
                </div>
                <div>
                  <div className="text-white/40">Updated</div>
                  <div className="mt-0.5 font-semibold text-white">{formatDate(kb.updated_at)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Hint about Phase 2 — keeps expectations clear during the build-out. */}
      <div className="mt-8 rounded-xl border border-amber-500/10 bg-amber-500/[0.04] p-4 text-[11.5px] text-amber-200/70">
        <div className="font-semibold text-amber-200/85">Phase 1 active</div>
        <div className="mt-1 leading-relaxed">
          Phase 1 stores raw text only — supports <code className="rounded bg-white/5 px-1">.txt</code> / <code className="rounded bg-white/5 px-1">.md</code> / <code className="rounded bg-white/5 px-1">.csv</code> / <code className="rounded bg-white/5 px-1">.json</code>. Phase 2 adds Gemini embeddings + vector search; Phase 3 wires retrieval into the chat / voice prompts.
          <br />
          <Plus size={11} className="mr-1 inline align-text-bottom" />
          PDF / DOCX upload is rejected for now.
        </div>
      </div>
    </div>
  );
}
