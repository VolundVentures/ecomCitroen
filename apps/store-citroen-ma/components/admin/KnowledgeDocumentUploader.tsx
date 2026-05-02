"use client";

// Drag-and-drop document uploader. Mirrors the Gallabox "Add sources" modal:
// click button → modal → drop file → server action uploads + extracts.

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, X, Plus, FileText } from "lucide-react";
import { uploadDocument } from "@/app/admin/[brand]/knowledge/actions";

type Props = {
  brandSlug: string;
  kbId: string;
  accent: string;
};

const ACCEPT = ".txt,.md,.markdown,.csv,.json,text/plain,text/markdown,text/csv,application/json";
const MAX_BYTES = 15 * 1024 * 1024;

export function KnowledgeDocumentUploader({ brandSlug, kbId, accent }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function close() {
    if (pending) return;
    setOpen(false);
    setFile(null);
    setErr(null);
  }

  function pick(f: File | null) {
    setErr(null);
    if (!f) return setFile(null);
    if (f.size > MAX_BYTES) {
      setErr(`File too large — max 15 MB. (${(f.size / 1024 / 1024).toFixed(1)} MB)`);
      return;
    }
    setFile(f);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setErr(null);
    const fd = new FormData();
    fd.set("brandSlug", brandSlug);
    fd.set("kbId", kbId);
    fd.set("file", file);
    startTransition(async () => {
      try {
        await uploadDocument(fd);
        router.refresh();
        close();
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:opacity-90"
        style={{ background: accent }}
      >
        <Plus size={13} strokeWidth={2.4} />
        Add sources
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4"
            onClick={close}
          >
            <motion.div
              initial={{ y: 14, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 8, scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 0.68, 0, 1] }}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e0e10] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[15px] font-semibold text-white">Add source</div>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md p-1 text-white/40 transition hover:bg-white/[0.06] hover:text-white/80"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    pick(e.dataTransfer.files?.[0] ?? null);
                  }}
                  onClick={() => inputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 transition ${
                    drag
                      ? "border-white/30 bg-white/[0.05]"
                      : "border-white/[0.12] bg-white/[0.02] hover:border-white/[0.22]"
                  }`}
                >
                  <UploadCloud size={26} className="text-white/45" strokeWidth={1.5} />
                  <div className="text-[13px] font-medium text-white/85">Drag and drop here to upload</div>
                  <div className="text-[11px] text-white/35">Supports TXT, MARKDOWN, CSV, JSON. Max 15 MB each.</div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11.5px] font-semibold text-white transition hover:bg-white/15"
                  >
                    <UploadCloud size={12} strokeWidth={2.2} />
                    Choose file
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => pick(e.target.files?.[0] ?? null)}
                  />
                </div>

                {file && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                    <FileText size={14} className="text-white/55" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-medium text-white">{file.name}</div>
                      <div className="text-[10.5px] text-white/40">
                        {file.type || "text/plain"} · {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      disabled={pending}
                      className="rounded-md p-1 text-white/40 transition hover:bg-white/[0.06] hover:text-white/80"
                      aria-label="Remove file"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                {err && (
                  <div className="rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
                    {err}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-3">
                  <button
                    type="button"
                    onClick={close}
                    disabled={pending}
                    className="rounded-lg px-3 py-2 text-[12px] font-medium text-white/65 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending || !file}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
                    style={{ background: accent }}
                  >
                    <UploadCloud size={13} strokeWidth={2.4} />
                    {pending ? "Uploading…" : "Add Source"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
