"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Eye, History, RotateCcw, Sparkles, Plus } from "lucide-react";
import type { PromptVersion } from "@/lib/supabase/database.types";
import { savePromptAction, activatePromptAction } from "@/app/admin/[brand]/prompt/actions";

type Props = {
  slug: string;
  prompts: PromptVersion[];
  accent: string;
};

const TONE_BLOCK_HEADER = "═══ TONE OVERRIDE ═══";

const TONE_PRESETS: Array<{ key: string; label: string; body: string }> = [
  {
    key: "warm",
    label: "Warm",
    body:
      "Speak in a friendly, conversational, human-first tone. Short sentences, generous acknowledgements, gentle humour when appropriate. Never stiff. The customer should feel like they're chatting with a helpful friend who happens to know cars.",
  },
  {
    key: "direct",
    label: "Direct",
    body:
      "Keep replies brief, factual, decisive. No filler, no flowery praise of the customer. Drive the qualification quickly without sacrificing politeness. One sentence preferred over two.",
  },
  {
    key: "premium",
    label: "Premium",
    body:
      "Speak in an elevated, concierge-grade tone. Polished vocabulary, calm pace, never pushy. Frame the visit as an experience rather than a transaction. Use the customer's first name once you have it.",
  },
  {
    key: "playful",
    label: "Playful",
    body:
      "Light, witty, energetic. One short joke or playful aside per conversation is welcome. Never sarcastic, never at the customer's expense. Always pivot back to the qualification within one turn.",
  },
];

const STEP_TEMPLATE = `\n\nTURN N — [What to ask].\n  Good: "[Example]"\n  Bad: anything that combines this with another question.`;

function applyTonePreset(draft: string, preset: { label: string; body: string }): string {
  const block = `${TONE_BLOCK_HEADER}\n${preset.label}: ${preset.body}\n`;
  // Strip any prior tone-override block (between this header and the next ═══ section).
  const re = new RegExp(`${TONE_BLOCK_HEADER}[\\s\\S]*?(?=\\n═══|$)`, "g");
  const stripped = draft.replace(re, "").trimStart();
  return `${block}\n${stripped}`;
}

export function PromptEditorClient({ slug, prompts, accent }: Props) {
  const active = prompts.find((p) => p.is_active) ?? prompts[0];
  const [draft, setDraft] = useState(active?.body ?? "");
  const [notes, setNotes] = useState("");
  const [activate, setActivate] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [showDiff, setShowDiff] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const baseline = active?.body ?? "";
  const dirty = draft !== baseline;

  const wordCount = draft.trim().split(/\s+/).filter(Boolean).length;
  const charCount = draft.length;

  const handleSave = () => {
    const fd = new FormData();
    fd.set("brandSlug", slug);
    fd.set("body", draft);
    fd.set("notes", notes);
    if (activate) fd.set("activate", "1");
    startTransition(async () => {
      await savePromptAction(fd);
      setSavedAt(Date.now());
      setNotes("");
    });
  };

  const handleRevert = () => setDraft(baseline);

  const handleLoad = (p: PromptVersion) => {
    setDraft(p.body);
  };

  const handleActivate = (id: string) => {
    const fd = new FormData();
    fd.set("brandSlug", slug);
    fd.set("promptId", id);
    startTransition(async () => {
      await activatePromptAction(fd);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
      {/* Editor */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div>
            <div className="text-[13px] font-semibold">Prompt body</div>
            <div className="text-[11px] text-white/40">
              Variables like brand name and model catalog are appended automatically. Just write the persona + flow.
            </div>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDiff((v) => !v)}
              disabled={!dirty}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-white/65 transition hover:border-white/30 hover:text-white disabled:opacity-40"
            >
              <Eye size={12} strokeWidth={1.7} />
              {showDiff ? "Hide diff" : "Show diff"}
            </button>
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-white/65 transition hover:border-white/30 hover:text-white"
            >
              <History size={12} strokeWidth={1.7} />
              History
            </button>
          </div>
        </div>

        {/* Quick edits — tone presets + step insert. Clicking a preset
            stamps a TONE OVERRIDE block at the top of the prompt; "Add a
            step" appends a TURN template at the bottom. */}
        <div className="mb-4 rounded-lg border border-white/[0.06] bg-white/[0.015] p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-white/45">
            <Sparkles size={11} strokeWidth={1.7} />
            Quick edits — tone & flow
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-white/50">Tone:</span>
            {TONE_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setDraft((d) => applyTonePreset(d, p))}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/75 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
                title={p.body}
              >
                {p.label}
              </button>
            ))}
            <span className="ms-3 hidden h-4 w-px bg-white/10 sm:block" />
            <button
              type="button"
              onClick={() => setDraft((d) => d.trimEnd() + STEP_TEMPLATE)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/75 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
            >
              <Plus size={11} strokeWidth={1.8} />
              Add a step
            </button>
          </div>
          <div className="mt-2 text-[10.5px] text-white/35">
            Tone overrides land at the top of the prompt and update Rihla's voice immediately on save. Edit the TURN sections below to add, remove, or reorder steps in the conversation flow.
          </div>
        </div>

        {showDiff && dirty ? (
          <DiffView baseline={baseline} draft={draft} accent={accent} />
        ) : (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={28}
            spellCheck={false}
            className="block w-full rounded-lg border border-white/10 bg-[#0a0a0e] px-4 py-3 font-mono text-[12.5px] leading-relaxed text-white outline-none focus:border-white/30"
          />
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-white/40">
          <div>
            {charCount.toLocaleString()} chars · {wordCount.toLocaleString()} words ·{" "}
            <span className={dirty ? "text-amber-300" : "text-emerald-400"}>
              {dirty ? "Unsaved changes" : "Up to date"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <button
                type="button"
                onClick={handleRevert}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-white/55 transition hover:border-white/30 hover:text-white"
              >
                <RotateCcw size={12} strokeWidth={1.7} />
                Revert
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What changed in this version? (optional)"
            className="min-w-[240px] flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-white/30"
          />
          <label className="flex items-center gap-2 text-[12px] text-white/65">
            <input
              type="checkbox"
              checked={activate}
              onChange={(e) => setActivate(e.target.checked)}
              className="h-4 w-4 accent-white"
            />
            Activate immediately
          </label>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !dirty}
            className="rounded-lg bg-white px-5 py-2 text-[12.5px] font-medium text-[#0c0c10] transition hover:bg-white/90 disabled:opacity-50"
            style={dirty && !isPending ? {} : {}}
          >
            {isPending ? "Saving…" : "Save new version"}
          </button>
        </div>

        <AnimatePresence>
          {savedAt && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-3 py-1.5 text-[11px] text-emerald-300"
            >
              <Check size={12} strokeWidth={2} /> Saved version
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Version history */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.22 }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold">Version history</div>
                <div className="text-[11px] text-white/40">{prompts.length} versions</div>
              </div>
            </div>

            <div className="space-y-2">
              {prompts.map((p) => (
                <div
                  key={p.id}
                  className={`group rounded-lg border p-3 transition ${
                    p.is_active ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/10 bg-white/[0.025]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] font-semibold text-white">v{p.version}</span>
                      {p.is_active && (
                        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-emerald-300">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[10.5px] text-white/35">
                      {new Date(p.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </div>
                  </div>
                  {p.notes && <div className="mt-1 line-clamp-2 text-[11.5px] text-white/55">{p.notes}</div>}
                  <div className="mt-2 flex gap-2 text-[10.5px]">
                    <button
                      type="button"
                      onClick={() => handleLoad(p)}
                      className="rounded-md border border-white/10 px-2 py-1 text-white/65 transition hover:border-white/30 hover:text-white"
                    >
                      Load
                    </button>
                    {!p.is_active && (
                      <button
                        type="button"
                        onClick={() => handleActivate(p.id)}
                        className="rounded-md border border-white/10 px-2 py-1 text-white/65 transition hover:border-white/30 hover:text-white"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {prompts.length === 0 && (
                <div className="py-6 text-center text-[11px] text-white/30">No versions yet.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Cheap line-level diff ────────────────────────────────────────────────

function DiffView({ baseline, draft, accent }: { baseline: string; draft: string; accent: string }) {
  const baseLines = baseline.split("\n");
  const draftLines = draft.split("\n");
  const baseSet = new Set(baseLines);
  const draftSet = new Set(draftLines);

  const merged: Array<{ kind: "same" | "add" | "del"; text: string }> = [];
  // Show baseline minus removed, then draft additions appended.
  for (const line of baseLines) {
    merged.push({ kind: draftSet.has(line) ? "same" : "del", text: line });
  }
  for (const line of draftLines) {
    if (!baseSet.has(line)) merged.push({ kind: "add", text: line });
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#0a0a0e] p-4 font-mono text-[11.5px] leading-relaxed">
      {merged.map((l, i) => (
        <div
          key={i}
          className={
            l.kind === "add"
              ? "bg-emerald-500/10 px-2 text-emerald-200"
              : l.kind === "del"
              ? "bg-red-500/10 px-2 text-red-200/85 line-through decoration-red-300/40"
              : "px-2 text-white/65"
          }
          style={l.kind === "add" ? { borderLeft: `3px solid ${accent}` } : {}}
        >
          {(l.kind === "add" ? "+ " : l.kind === "del" ? "− " : "  ") + l.text}
        </div>
      ))}
    </div>
  );
}
