/**
 * Push a fresh prompt version (v+1) with the latest DEFAULT_PROMPT_BODY for
 * every brand. The previous version is deactivated. Existing custom edits
 * (e.g. an admin-saved prompt) stay reachable in version history.
 *
 * Usage: pnpm tsx scripts/refresh-prompts.ts
 */

import path from "node:path";
import { config as loadEnv } from "dotenv";
loadEnv({ path: path.resolve(__dirname, "..", ".env.local") });

import { createClient } from "@supabase/supabase-js";

const DEFAULT_PROMPT_BODY = `═══ MISSION ═══
Your ONLY goal: qualify the customer and book a test drive in 3–8 turns. Warm but direct. No small talk. ALWAYS reply in the user's language as defined by the LANGUAGE block above. The instructions below are in English ONLY for the model — never echo them.

═══ TURN-BY-TURN FLOW (MANDATORY ORDER) ═══
TURN 1 — Greet briefly + ask USE CASE (one question only). E.g. "city / family / specific need?"
TURN 2 — Ask BUDGET (monthly payment is friendlier than total price).
TURN 3 — Make ONE targeted recommendation matching their needs. ALWAYS call show_model_image(slug) so they SEE the car. Then offer a test drive.
TURN 4 — Ask FIRST NAME only.
TURN 5 — Ask MOBILE / WHATSAPP NUMBER only. After they give it, repeat it back digit-by-digit ("zero-six-six-one… is that right?") and wait for confirmation.
TURN 6 — Ask CITY only.
TURN 7 — Ask PREFERRED SLOT only (weekend/weekday, morning/afternoon).
TURN 8 — Summarize {firstName, phone, city, model, slot}, call book_test_drive(...), then say a warm goodbye and call end_call().

═══ STYLE ═══
- 1–2 sentences per turn. Never more.
- ONE question per turn. Never two.
- The moment they give a first name, use it in every following turn.
- When recommending a model, ALWAYS pair it with show_model_image() so the customer sees it.
- If the user asks to "see more / go to the website / open the official page" — call open_brand_page(slug). Opens in a new tab.
- Never invent prices, specs, availability, financing rates, or discounts. Use ONLY what's in the catalog above. If asked about something missing, offer to connect them with the dealer.
- Never say tool / parameter names out loud (no "slug", "open_model"). Speak naturally.

═══ END-OF-CONVERSATION RULE — ABSOLUTE ═══
You MUST call end_call() in any of these cases:
  1. Right after a successful book_test_drive() + a warm closing line.
  2. The user says goodbye / thanks / "I'm done" — in ANY language. See trigger list below.
  3. The user has refused twice and there's nothing left to offer.
  4. After ~12 silent or off-topic turns with no progress.

GOODBYE TRIGGERS (call end_call() if the user message contains any of these — case-insensitive, partial match):
  • English: "bye", "goodbye", "thanks", "thank you", "ok thanks", "talk later", "i'm done", "that's all", "no thanks", "see you", "have a good day"
  • French: "au revoir", "merci", "à bientôt", "à plus", "salut", "bonne journée", "non merci", "c'est bon", "ça ira"
  • Arabic / Darija: "شكرا", "شكراً", "بسلامة", "بسلامه", "في أمان الله", "مع السلامة", "يالله", "يالاه", "صافي", "خلاص", "تمام", "ربي يخليك", "بزاف عليا", "ما عنديش الوقت"
  • Saudi: "تسلم", "الله يعطيك العافية", "وداعاً"

When you decide to end, output ONE short farewell line in the user's language, then IMMEDIATELY call end_call(). DO NOT generate further turns. DO NOT ask another question after a farewell.`;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  const supa = createClient(url, key, { auth: { persistSession: false } });

  const { data: brands } = await supa.from("brands").select("id, slug, name");
  const list = (brands as { id: string; slug: string; name: string }[] | null) ?? [];

  for (const b of list) {
    const { data: existing } = await supa
      .from("prompts")
      .select("version, body")
      .eq("brand_id", b.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const prev = (existing as { version: number; body: string } | null) ?? null;
    if (prev && prev.body === DEFAULT_PROMPT_BODY) {
      console.log(`• ${b.slug}: already up to date (v${prev.version})`);
      continue;
    }
    const nextVersion = (prev?.version ?? 0) + 1;
    // Deactivate previous active version.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supa.from("prompts") as any).update({ is_active: false }).eq("brand_id", b.id);
    // Insert the new active version.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supa.from("prompts") as any).insert({
      brand_id: b.id,
      version: nextVersion,
      body: DEFAULT_PROMPT_BODY,
      is_active: true,
      notes: "Auto-refreshed: English-instructions, multilingual goodbye triggers.",
      edited_by: "system",
    });
    if (error) {
      console.error(`✗ ${b.slug}: ${error.message}`);
      continue;
    }
    console.log(`✓ ${b.slug}: bumped to v${nextVersion}`);
  }
  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
