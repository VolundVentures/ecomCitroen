"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand, PromptVersion } from "@/lib/supabase/database.types";

export async function savePromptAction(formData: FormData) {
  const brandSlug = String(formData.get("brandSlug") ?? "");
  const body = String(formData.get("body") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const activate = formData.get("activate") === "on";

  const supa = adminClient();
  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", brandSlug).single();
  const brand = brandRow as unknown as Brand | null;
  if (!brand) throw new Error(`brand not found: ${brandSlug}`);

  // Compute next version number.
  const { data: latest } = await supa
    .from("prompts")
    .select("version")
    .eq("brand_id", brand.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = ((latest as unknown as { version?: number } | null)?.version ?? 0) + 1;

  // Insert new version.
  const { data: newRow } = await (supa.from("prompts") as any)
    .insert({
      brand_id: brand.id,
      version: nextVersion,
      body,
      notes: notes || null,
      edited_by: "admin",
      is_active: false,
    })
    .select()
    .single();

  if (activate && newRow) {
    // Deactivate previous active prompts and activate the new one.
    await (supa.from("prompts") as any).update({ is_active: false }).eq("brand_id", brand.id);
    await (supa.from("prompts") as any).update({ is_active: true }).eq("id", (newRow as unknown as PromptVersion).id);
  }

  revalidatePath(`/admin/${brandSlug}/prompt`);
}

export async function activatePromptAction(formData: FormData) {
  const brandSlug = String(formData.get("brandSlug") ?? "");
  const promptId = String(formData.get("promptId") ?? "");
  const supa = adminClient();
  const { data: brandRow } = await supa.from("brands").select("id").eq("slug", brandSlug).single();
  const brand = brandRow as unknown as { id: string } | null;
  if (!brand) throw new Error(`brand not found: ${brandSlug}`);
  await (supa.from("prompts") as any).update({ is_active: false }).eq("brand_id", brand.id);
  await (supa.from("prompts") as any).update({ is_active: true }).eq("id", promptId);
  revalidatePath(`/admin/${brandSlug}/prompt`);
}
