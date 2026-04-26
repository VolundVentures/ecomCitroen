"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";

const VALID_VOICES = ["Zephyr", "Aoede", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus"] as const;
const VALID_LOCALES = ["fr-MA", "ar-MA", "darija-MA", "en-MA", "ar-SA", "en-SA"] as const;

export async function updateBrandAction(brandId: string, formData: FormData) {
  const supa = adminClient();
  const update: Record<string, unknown> = {};

  const name = String(formData.get("name") ?? "").trim();
  const agentName = String(formData.get("agent_name") ?? "").trim();
  const primaryColor = String(formData.get("primary_color") ?? "").trim();
  const voiceName = String(formData.get("voice_name") ?? "").trim();
  const homepageUrl = String(formData.get("homepage_url") ?? "").trim();

  if (name) update.name = name;
  if (agentName) update.agent_name = agentName;
  if (homepageUrl) update.homepage_url = homepageUrl;
  if (/^#[0-9a-fA-F]{6}$/.test(primaryColor)) update.primary_color = primaryColor;
  if ((VALID_VOICES as readonly string[]).includes(voiceName)) update.voice_name = voiceName;

  const locales: string[] = [];
  for (const loc of VALID_LOCALES) {
    if (formData.get(`locale_${loc}`)) locales.push(loc);
  }
  if (locales.length > 0) update.locales = locales;

  if (Object.keys(update).length === 0) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supa.from("brands") as any).update(update).eq("id", brandId);
  revalidatePath("/admin", "layout");
}

export async function toggleModelAction(modelId: string, enabled: boolean) {
  const supa = adminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supa.from("models") as any).update({ enabled }).eq("id", modelId);
  revalidatePath("/admin", "layout");
}
