import type { ConversationStatus } from "@/lib/supabase/database.types";

const STYLES: Record<ConversationStatus, { bg: string; fg: string; label: string }> = {
  open: { bg: "rgba(99,102,241,0.16)", fg: "#a5b4fc", label: "Open" },
  closed_lead: { bg: "rgba(16,185,129,0.16)", fg: "#6ee7b7", label: "Lead" },
  closed_no_lead: { bg: "rgba(255,255,255,0.07)", fg: "rgba(255,255,255,0.55)", label: "Closed" },
  abandoned: { bg: "rgba(239,68,68,0.14)", fg: "#fca5a5", label: "Abandoned" },
};

export function ConversationStatusPill({ status }: { status: ConversationStatus }) {
  const s = STYLES[status] ?? STYLES.closed_no_lead;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}
