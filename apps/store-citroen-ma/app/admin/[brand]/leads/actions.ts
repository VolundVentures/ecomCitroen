"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";

export async function updateLeadStatusAction(leadId: string, status: "new" | "contacted" | "closed") {
  const supa = adminClient();
  await (supa.from("leads") as any).update({ status }).eq("id", leadId); // eslint-disable-line @typescript-eslint/no-explicit-any
  revalidatePath("/admin", "layout");
}
