"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import type { AppointmentStatus } from "@/lib/supabase/database.types";

export async function updateAppointmentStatusAction(
  appointmentId: string,
  status: AppointmentStatus,
  notes?: string
) {
  const supa = adminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = { status };
  if (notes !== undefined) update.notes = notes;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supa.from("service_appointments") as any).update(update).eq("id", appointmentId);
  revalidatePath("/admin", "layout");
}
