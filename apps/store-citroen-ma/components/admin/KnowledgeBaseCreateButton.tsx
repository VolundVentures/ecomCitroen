"use client";

// Floating "+ Add Knowledge Base" button + modal. Mirrors the Gallabox UX:
// click → tiny modal asking for name + description → save → redirect to the
// new KB's detail page.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { createKnowledgeBase } from "@/app/admin/[brand]/knowledge/actions";

type Props = {
  brandSlug: string;
  accent: string;
};

export function KnowledgeBaseCreateButton({ brandSlug, accent }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function close() {
    if (pending) return;
    setOpen(false);
    setName("");
    setDescription("");
    setErr(null);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData();
    fd.set("brandSlug", brandSlug);
    fd.set("name", name.trim());
    fd.set("description", description.trim());
    startTransition(async () => {
      try {
        const { id } = await createKnowledgeBase(fd);
        router.push(`/admin/${brandSlug}/knowledge/${id}`);
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
        className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:opacity-90"
        style={{ background: accent }}
      >
        <Plus size={14} strokeWidth={2.4} />
        Add Knowledge Base
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
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e0e10] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[15px] font-semibold text-white">Create Knowledge Base</div>
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
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Catalog · Warranty · FAQ …"
                    required
                    maxLength={120}
                    autoFocus
                    className="w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-[13px] text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What kind of content lives here?"
                    rows={3}
                    maxLength={255}
                    className="w-full resize-none rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-[13px] text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
                  />
                  <div className="mt-1 text-end text-[10px] text-white/30">{description.length}/255</div>
                </div>

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
                    disabled={pending || !name.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
                    style={{ background: accent }}
                  >
                    <Plus size={13} strokeWidth={2.4} />
                    {pending ? "Creating…" : "Create"}
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
