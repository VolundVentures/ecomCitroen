"use client";

// Settings panel for a single KB. Mirrors Gallabox's "Knowledge Base Settings"
// shape — Vector Search (Top-K) + Chunk Settings (size + overlap) + Enabled
// toggle. Phase 2 will start using these values; Phase 1 just persists them.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Settings as Gear, RefreshCw } from "lucide-react";
import type { KnowledgeBase } from "@/lib/supabase/database.types";
import { updateKnowledgeBase, deleteKnowledgeBase, reEmbedKnowledgeBase } from "@/app/admin/[brand]/knowledge/actions";

type Props = {
  brandSlug: string;
  kb: KnowledgeBase;
  accent: string;
};

export function KnowledgeBaseSettings({ brandSlug, kb, accent }: Props) {
  const router = useRouter();
  const [name, setName] = useState(kb.name);
  const [description, setDescription] = useState(kb.description ?? "");
  const [topK, setTopK] = useState(kb.top_k);
  const [chunkSize, setChunkSize] = useState(kb.chunk_size);
  const [chunkOverlap, setChunkOverlap] = useState(kb.chunk_overlap);
  const [enabled, setEnabled] = useState(kb.enabled);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const dirty =
    name !== kb.name ||
    (description ?? "") !== (kb.description ?? "") ||
    topK !== kb.top_k ||
    chunkSize !== kb.chunk_size ||
    chunkOverlap !== kb.chunk_overlap ||
    enabled !== kb.enabled;

  function reset() {
    setName(kb.name);
    setDescription(kb.description ?? "");
    setTopK(kb.top_k);
    setChunkSize(kb.chunk_size);
    setChunkOverlap(kb.chunk_overlap);
    setEnabled(kb.enabled);
    setMsg(null);
  }

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData();
    fd.set("brandSlug", brandSlug);
    fd.set("id", kb.id);
    fd.set("name", name.trim());
    fd.set("description", description.trim());
    fd.set("top_k", String(topK));
    fd.set("chunk_size", String(chunkSize));
    fd.set("chunk_overlap", String(chunkOverlap));
    if (enabled) fd.set("enabled", "on");
    startTransition(async () => {
      try {
        await updateKnowledgeBase(fd);
        setMsg({ kind: "ok", text: "Settings saved." });
        router.refresh();
      } catch (e) {
        setMsg({ kind: "err", text: (e as Error).message });
      }
    });
  }

  function destroy() {
    if (!confirm(`Delete "${kb.name}"? Documents and uploaded files are removed too. This cannot be undone.`)) return;
    const fd = new FormData();
    fd.set("brandSlug", brandSlug);
    fd.set("id", kb.id);
    startTransition(async () => {
      try {
        await deleteKnowledgeBase(fd);
        router.push(`/admin/${brandSlug}/knowledge`);
      } catch (e) {
        setMsg({ kind: "err", text: (e as Error).message });
      }
    });
  }

  function reEmbedAll() {
    if (dirty) {
      setMsg({ kind: "err", text: "Save settings first — re-embed uses the persisted values." });
      return;
    }
    if (!confirm("Re-embed every document in this knowledge base with the current chunk settings? Existing chunks are replaced.")) return;
    setMsg(null);
    const fd = new FormData();
    fd.set("brandSlug", brandSlug);
    fd.set("kbId", kb.id);
    startTransition(async () => {
      try {
        const r = await reEmbedKnowledgeBase(fd);
        const parts = [`${r.documents} document${r.documents === 1 ? "" : "s"} re-embedded`, `${r.chunks} chunks`];
        if (r.failed > 0) parts.push(`${r.failed} failed`);
        setMsg({ kind: r.failed > 0 ? "err" : "ok", text: parts.join(" · ") });
        router.refresh();
      } catch (e) {
        setMsg({ kind: "err", text: (e as Error).message });
      }
    });
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-[13px] text-white focus:border-white/25 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">Status</label>
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`flex h-[38px] w-full items-center justify-center gap-2 rounded-lg border text-[12.5px] font-semibold transition ${
              enabled
                ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-200"
                : "border-white/[0.1] bg-white/[0.02] text-white/55 hover:bg-white/[0.05]"
            }`}
          >
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${enabled ? "bg-emerald-400" : "bg-white/30"}`} />
            {enabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={255}
          rows={2}
          className="w-full resize-none rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-[13px] text-white focus:border-white/25 focus:outline-none"
        />
      </div>

      {/* Vector Search */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md text-white/65" style={{ background: `${accent}1A`, color: accent }}>
            <Search size={13} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-white">Vector Search</div>
            <div className="text-[10.5px] text-white/40">Top-K chunks injected per query (Phase 3 wires this into chat / voice).</div>
          </div>
        </div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">Top K results</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="flex-1 accent-white/80"
            style={{ accentColor: accent }}
          />
          <input
            type="number"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => setTopK(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            className="w-16 rounded-md border border-white/[0.1] bg-white/[0.03] px-2 py-1 text-center text-[12px] text-white tabular-nums focus:border-white/25 focus:outline-none"
          />
        </div>
      </div>

      {/* Chunk Settings */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md text-white/65" style={{ background: `${accent}1A`, color: accent }}>
            <Gear size={13} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-white">Chunk Settings</div>
            <div className="text-[10.5px] text-white/40">How uploaded text is split for embedding (Phase 2).</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">Max chunk length</label>
            <input
              type="number"
              min={200}
              max={4000}
              value={chunkSize}
              onChange={(e) => setChunkSize(Math.max(200, Math.min(4000, Number(e.target.value) || 200)))}
              className="w-full rounded-md border border-white/[0.1] bg-white/[0.03] px-2 py-1.5 text-[12.5px] text-white tabular-nums focus:border-white/25 focus:outline-none"
            />
            <div className="mt-1 text-[10px] text-white/35">Characters per chunk</div>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">Chunk overlap</label>
            <input
              type="number"
              min={0}
              max={1000}
              value={chunkOverlap}
              onChange={(e) => setChunkOverlap(Math.max(0, Math.min(1000, Number(e.target.value) || 0)))}
              className="w-full rounded-md border border-white/[0.1] bg-white/[0.03] px-2 py-1.5 text-[12.5px] text-white tabular-nums focus:border-white/25 focus:outline-none"
            />
            <div className="mt-1 text-[10px] text-white/35">Overlap between chunks</div>
          </div>
        </div>
      </div>

      {msg && (
        <div
          className={`rounded-md border px-3 py-2 text-[12px] ${
            msg.kind === "ok"
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/25 bg-red-500/10 text-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={destroy}
            disabled={pending}
            className="rounded-lg border border-red-500/30 bg-red-500/[0.04] px-3 py-2 text-[12px] font-semibold text-red-200 transition hover:bg-red-500/10 disabled:opacity-40"
          >
            Delete knowledge base
          </button>
          <button
            type="button"
            onClick={reEmbedAll}
            disabled={pending || dirty}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-[12px] font-semibold text-white/75 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-40"
            title={dirty ? "Save settings first" : "Re-embed every document with current chunk settings"}
          >
            <RefreshCw size={12} strokeWidth={2} className={pending ? "animate-spin" : ""} />
            Re-embed all
          </button>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="me-2 inline-flex items-center gap-1.5 text-[11px] text-white/45">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              Unsaved changes
            </span>
          )}
          <button
            type="button"
            onClick={reset}
            disabled={pending || !dirty}
            className="rounded-lg px-3 py-2 text-[12px] font-medium text-white/65 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={pending || !dirty || !name.trim()}
            className="rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
            style={{ background: accent }}
          >
            {pending ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    </form>
  );
}
