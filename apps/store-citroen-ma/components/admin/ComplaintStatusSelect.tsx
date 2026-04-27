"use client";

import { useTransition } from "react";
import type { ComplaintStatus } from "@/lib/supabase/database.types";
import { updateComplaintStatusAction } from "@/app/admin/[brand]/complaints/actions";

const STATUSES: { value: ComplaintStatus; label: string }[] = [
  { value: "new",                  label: "New" },
  { value: "qualified",            label: "Qualified" },
  { value: "assigned",             label: "Assigned" },
  { value: "in_progress",          label: "In progress" },
  { value: "resolved",             label: "Resolved" },
  { value: "closed_no_resolution", label: "Closed (unresolved)" },
];

export function ComplaintStatusSelect({
  complaintId,
  status,
}: {
  complaintId: string;
  status: ComplaintStatus;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as ComplaintStatus;
        startTransition(async () => {
          await updateComplaintStatusAction(complaintId, next);
        });
      }}
      className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] text-white/85 outline-none transition focus:border-white/30"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value} className="bg-[#0c0c10]">
          {s.label}
        </option>
      ))}
    </select>
  );
}
