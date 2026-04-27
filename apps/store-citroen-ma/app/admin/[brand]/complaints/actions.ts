"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import type { ComplaintStatus } from "@/lib/supabase/database.types";

export async function updateComplaintStatusAction(
  complaintId: string,
  status: ComplaintStatus,
  crcNotes?: string
) {
  const supa = adminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = { status };
  if (crcNotes !== undefined) update.crc_notes = crcNotes;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supa.from("complaints") as any).update(update).eq("id", complaintId);
  revalidatePath("/admin", "layout");
}
