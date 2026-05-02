"use client";

// Click-to-preview table for KB documents. Each row is a button that opens a
// right-side sheet with the extracted text + metadata. Lightweight: the page
// already fetches documents with their raw_text on the server, so the sheet
// just renders what's already in memory.

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, AlertTriangle, CheckCircle2, Loader2, X, Copy, Check, RefreshCw, Boxes } from "lucide-react";
import type { KnowledgeDocument } from "@/lib/supabase/database.types";
import { KnowledgeDocumentDeleteButton } from "@/components/admin/KnowledgeDocumentDeleteButton";
import { reEmbedDocument } from "@/app/admin/[brand]/knowledge/actions";

type DocWithChunks = KnowledgeDocument & { chunk_count: number; chunk_tokens: number };

type Props = {
  brandSlug: string;
  kbId: string;
  documents: DocWithChunks[];
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function StatusPill({ status }: { status: KnowledgeDocument["status"] }) {
  const map: Record<KnowledgeDocument["status"], { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
    pending:    { label: "Pending",    cls: "bg-white/[0.06] text-white/55 ring-white/10",            Icon: Loader2 },
    processing: { label: "Processing", cls: "bg-amber-500/10 text-amber-200 ring-amber-500/20",       Icon: Loader2 },
    ready:      { label: "Ready",      cls: "bg-emerald-500/10 text-emerald-200 ring-emerald-500/25", Icon: CheckCircle2 },
    failed:     { label: "Failed",     cls: "bg-red-500/10 text-red-200 ring-red-500/25",             Icon: AlertTriangle },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${cls}`}>
      <Icon size={10} strokeWidth={2.2} />
      {label}
    </span>
  );
}

export function KnowledgeDocumentTable({ brandSlug, kbId, documents }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<DocWithChunks | null>(null);
  const [copied, setCopied] = useState(false);
  const [embeddingId, setEmbeddingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const close = useCallback(() => {
    setOpen(null);
    setCopied(false);
  }, []);

  const reEmbed = useCallback((docId: string) => {
    if (embeddingId) return;
    setEmbeddingId(docId);
    const fd = new FormData();
    fd.set("brandSlug", brandSlug);
    fd.set("kbId", kbId);
    fd.set("id", docId);
    startTransition(async () => {
      try {
        await reEmbedDocument(fd);
        router.refresh();
      } catch (e) {
        alert(`Re-embed failed: ${(e as Error).message}`);
      } finally {
        setEmbeddingId(null);
      }
    });
  }, [brandSlug, kbId, embeddingId, router]);

  // ESC closes the sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const copyText = async () => {
    if (!open?.raw_text) return;
    try {
      await navigator.clipboard.writeText(open.raw_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked — silent */ }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-start text-[10px] uppercase tracking-[0.16em] text-white/40">
              <th className="px-2 py-2 font-medium">Source</th>
              <th className="px-2 py-2 font-medium">Status</th>
              <th className="px-2 py-2 font-medium">Chunks</th>
              <th className="px-2 py-2 font-medium">Size</th>
              <th className="px-2 py-2 font-medium">Added</th>
              <th className="px-2 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr
                key={doc.id}
                onClick={() => setOpen(doc)}
                className="cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.04]"
              >
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.05] text-white/55">
                      <FileText size={12} strokeWidth={1.7} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-white">{doc.name}</div>
                      <div className="mt-0.5 text-[10.5px] text-white/35">{doc.mime_type ?? doc.source_type}</div>
                      {doc.error_message && (
                        <div className="mt-0.5 line-clamp-1 text-[10.5px] text-red-300/70" title={doc.error_message}>{doc.error_message}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3"><StatusPill status={embeddingId === doc.id ? "processing" : doc.status} /></td>
                <td className="px-2 py-3 tabular-nums">
                  {doc.chunk_count > 0 ? (
                    <div className="flex items-center gap-1.5 text-white/75">
                      <Boxes size={11} strokeWidth={1.8} className="text-white/35" />
                      <span className="font-medium">{doc.chunk_count}</span>
                      <span className="text-[10px] text-white/35">· {doc.chunk_tokens.toLocaleString()} tok</span>
                    </div>
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                </td>
                <td className="px-2 py-3 tabular-nums text-white/65">{formatBytes(doc.size_bytes)}</td>
                <td className="px-2 py-3 text-white/55">
                  {new Date(doc.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </td>
                <td className="px-2 py-3 text-end" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-0.5">
                    <button
                      type="button"
                      onClick={() => reEmbed(doc.id)}
                      disabled={!!embeddingId}
                      className="rounded-md p-1.5 text-white/35 transition hover:bg-white/[0.06] hover:text-white/85 disabled:opacity-40"
                      title={doc.chunk_count > 0 ? "Re-embed (rebuilds chunks)" : "Embed"}
                      aria-label="Re-embed document"
                    >
                      <RefreshCw
                        size={13}
                        strokeWidth={1.8}
                        className={embeddingId === doc.id ? "animate-spin" : ""}
                      />
                    </button>
                    <KnowledgeDocumentDeleteButton brandSlug={brandSlug} kbId={kbId} id={doc.id} name={doc.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-in sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={close}
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
            />
            <motion.aside
              key="sheet"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 0.68, 0, 1] }}
              role="dialog"
              aria-label={open.name}
              className="fixed inset-y-0 end-0 z-50 flex w-full max-w-[640px] flex-col border-s border-white/[0.08] bg-[#0a0a0c] shadow-[-24px_0_60px_-12px_rgba(0,0,0,0.45)]"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] p-5">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-white/65">
                    <FileText size={15} strokeWidth={1.7} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold text-white">{open.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/50">
                      <StatusPill status={open.status} />
                      <span>·</span>
                      <span>{open.mime_type ?? open.source_type}</span>
                      <span>·</span>
                      <span className="tabular-nums">{formatBytes(open.size_bytes)}</span>
                      {open.chunk_count > 0 && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Boxes size={10} strokeWidth={2} />
                            {open.chunk_count} chunks · {open.chunk_tokens.toLocaleString()} tok
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>{new Date(open.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md p-1.5 text-white/45 transition hover:bg-white/[0.06] hover:text-white"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.04] px-5 py-2.5">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">
                  Extracted content {open.raw_text ? `· ${open.raw_text.length.toLocaleString()} chars` : ""}
                </div>
                <button
                  type="button"
                  onClick={copyText}
                  disabled={!open.raw_text}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/75 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-30"
                >
                  {copied ? <Check size={11} strokeWidth={2.4} /> : <Copy size={11} strokeWidth={2} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-auto bg-[#080809] px-5 py-4">
                {open.error_message && (
                  <div className="mb-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
                    <span className="font-semibold">Extraction error:</span> {open.error_message}
                  </div>
                )}
                {open.raw_text ? (
                  <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-white/85">
                    {open.raw_text}
                  </pre>
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] py-10 text-center text-[12px] text-white/40">
                    {open.status === "processing" || open.status === "pending"
                      ? "Extraction in progress — refresh in a moment to see the content."
                      : "No extracted text available."}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3 text-[11px] text-white/40">
                <code className="truncate text-white/35">{open.storage_path ?? open.source_url ?? "(no source path)"}</code>
                <KnowledgeDocumentDeleteButton brandSlug={brandSlug} kbId={kbId} id={open.id} name={open.name} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
