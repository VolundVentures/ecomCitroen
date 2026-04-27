"use client";

import { useTransition } from "react";
import type { AppointmentStatus } from "@/lib/supabase/database.types";
import { updateAppointmentStatusAction } from "@/app/admin/[brand]/appointments/actions";

const STATUSES: { value: AppointmentStatus; label: string }[] = [
  { value: "new",        label: "New" },
  { value: "qualified",  label: "Qualified" },
  { value: "assigned",   label: "Assigned" },
  { value: "confirmed",  label: "Confirmed" },
  { value: "completed",  label: "Completed" },
  { value: "cancelled",  label: "Cancelled" },
];

export function AppointmentStatusSelect({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: AppointmentStatus;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as AppointmentStatus;
        startTransition(async () => {
          await updateAppointmentStatusAction(appointmentId, next);
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
