"use client";

import { useState, useTransition } from "react";
import { updateLeadStatusAction } from "@/app/admin/[brand]/leads/actions";

const STATUSES = [
  { id: "new", label: "New", color: "#3b82f6" },
  { id: "contacted", label: "Contacted", color: "#f59e0b" },
  { id: "closed", label: "Closed", color: "#10b981" },
] as const;

type Status = (typeof STATUSES)[number]["id"];

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: Status }) {
  const [current, setCurrent] = useState<Status>(status);
  const [, startTransition] = useTransition();

  const change = (next: Status) => {
    if (next === current) return;
    setCurrent(next);
    startTransition(async () => {
      await updateLeadStatusAction(leadId, next);
    });
  };

  return (
    <select
      value={current}
      onChange={(e) => change(e.target.value as Status)}
      className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white outline-none transition hover:border-white/30 focus:border-white/40"
      style={{ color: STATUSES.find((s) => s.id === current)?.color }}
    >
      {STATUSES.map((s) => (
        <option key={s.id} value={s.id} className="bg-[#0a0a0c] text-white">
          {s.label}
        </option>
      ))}
    </select>
  );
}
