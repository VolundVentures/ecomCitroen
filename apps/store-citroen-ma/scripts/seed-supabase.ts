/**
 * Seed Supabase from scraped brand-data JSONs.
 *
 * Idempotent — safe to re-run. Upserts brands by slug, replaces models per
 * brand, and creates an initial prompt version (v1) if no prompt exists yet.
 *
 * Prereqs:
 *   - SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL set in .env.local
 *   - Migration 00001_init.sql applied to the project
 *   - Scraper has produced scripts/brand-data/{slug}.json files
 *
 * Usage: pnpm tsx scripts/seed-supabase.ts
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
loadEnv({ path: path.resolve(__dirname, "..", ".env.local") });

import { createClient } from "@supabase/supabase-js";

type Model = {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  bodyType?: string;
  priceFrom?: number | null;
  currency?: string | null;
  fuel?: string | null;
  transmission?: string | null;
  seats?: number | null;
  heroImage: string;
  galleryImages?: string[];
  keyFeatures?: string[];
  specs?: Record<string, string>;
  pageUrl: string;
};
type BrandPayload = {
  slug: string;
  name: string;
  homepage: string;
  market: string;
  defaultCurrency: string;
  scrapedAt: string;
  models: Model[];
};

// Per-brand metadata that isn't in the scraped JSON (logo, color, locales).
const BRAND_META: Record<string, {
  primaryColor: string;
  logoUrl: string;
  voiceName: string;
  agentName: string;
  locales: string[];
}> = {
  "jeep-ma": {
    primaryColor: "#000000",
    logoUrl: "/brands/jeep-ma/logo.svg",
    voiceName: "Zephyr",
    agentName: "Rihla",
    locales: ["fr-MA", "ar-MA", "darija-MA", "en-MA"],
  },
  "citroen-ma": {
    primaryColor: "#C8102E",
    logoUrl: "/brands/citroen-ma/logo.svg",
    voiceName: "Zephyr",
    agentName: "Rihla",
    locales: ["fr-MA", "ar-MA", "darija-MA", "en-MA"],
  },
  "peugeot-ksa": {
    primaryColor: "#1B1B1B",
    logoUrl: "/brands/peugeot-ksa/logo.svg",
    voiceName: "Zephyr",
    agentName: "Rihla",
    locales: ["en-SA", "ar-SA"],
  },
};

function normalizeCurrency(input: string | null | undefined, fallback: string): string {
  const v = (input ?? "").toUpperCase();
  if (v === "DH" || v === "DHS" || v === "DHM") return "MAD";
  if (v === "MAD" || v === "SAR" || v === "AED") return v;
  return fallback;
}

const DEFAULT_PROMPT_BODY = `═══ MISSION ═══
Ton SEUL objectif : qualifier le client et booker un essai en 3 à 6 tours. Chaleureuse mais directe. Pas de bavardage.

═══ FLOW OBLIGATOIRE ═══
TOUR 1 — Accueil + question d'usage (UNE seule question).
TOUR 2 — Budget mensuel (la mensualité, pas le prix total).
TOUR 3 — UNE recommandation ciblée + appelle show_model_image() pour montrer la voiture, puis propose l'essai.
TOUR 4 — Demande le PRÉNOM uniquement.
TOUR 5 — Demande le NUMÉRO MOBILE / WhatsApp uniquement (et répète-le pour confirmation).
TOUR 6 — Demande la VILLE uniquement.
TOUR 7 — Demande le CRÉNEAU PRÉFÉRÉ uniquement.
TOUR 8 — Récap + book_test_drive() + end_call().

═══ STYLE ═══
- 1 à 2 phrases par tour. Jamais plus.
- UNE SEULE question par tour.
- Dès que le client donne son prénom, utilise-le à chaque tour.
- Quand tu recommandes un modèle, appelle TOUJOURS show_model_image() pour qu'il voie la voiture.
- Si le client veut "voir plus" ou "aller sur le site", appelle open_brand_page() pour ouvrir la page officielle.

═══ FIN D'APPEL ═══
Tu DOIS appeler end_call() après toute phrase d'au revoir, après un booking réussi, ou après deux refus.`;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  }
  const supa = createClient(url, serviceKey, { auth: { persistSession: false } });

  const dataDir = path.resolve(__dirname, "brand-data");
  const files = (await fs.readdir(dataDir)).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const slug = file.replace(/\.json$/, "");
    const meta = BRAND_META[slug];
    if (!meta) {
      console.log(`skip ${slug} — no metadata mapping`);
      continue;
    }
    const payload = JSON.parse(await fs.readFile(path.join(dataDir, file), "utf8")) as BrandPayload;
    console.log(`\n=== ${payload.name} (${slug}) ===`);

    // Upsert brand.
    const { data: brand, error: bErr } = await supa
      .from("brands")
      .upsert(
        {
          slug,
          name: payload.name,
          homepage_url: payload.homepage,
          market: payload.market,
          default_currency: payload.defaultCurrency,
          locales: meta.locales,
          primary_color: meta.primaryColor,
          logo_url: meta.logoUrl,
          voice_name: meta.voiceName,
          agent_name: meta.agentName,
          enabled: true,
        },
        { onConflict: "slug" }
      )
      .select()
      .single();
    if (bErr || !brand) throw new Error(`upsert brand failed: ${bErr?.message}`);
    console.log(`  ✓ brand id=${brand.id}`);

    // Replace models for this brand.
    const { error: dErr } = await supa.from("models").delete().eq("brand_id", brand.id);
    if (dErr) throw new Error(`delete models failed: ${dErr.message}`);

    const rows = payload.models.map((m, i) => ({
      brand_id: brand.id,
      slug: m.slug,
      name: m.name,
      tagline: m.tagline ?? null,
      description: m.description ?? null,
      body_type: m.bodyType ?? null,
      price_from: m.priceFrom && m.priceFrom > 0 ? m.priceFrom : null,
      currency: normalizeCurrency(m.currency, payload.defaultCurrency),
      fuel: m.fuel ?? null,
      transmission: m.transmission ?? null,
      seats: m.seats ?? null,
      hero_image_url: m.heroImage,
      gallery_images: m.galleryImages ?? [],
      key_features: m.keyFeatures ?? [],
      specs: m.specs ?? {},
      page_url: m.pageUrl,
      display_order: i + 1,
      enabled: true,
    }));
    if (rows.length > 0) {
      const { error: iErr } = await supa.from("models").insert(rows);
      if (iErr) throw new Error(`insert models failed: ${iErr.message}`);
    }
    console.log(`  ✓ inserted ${rows.length} models`);

    // Initial prompt v1, only if none exists for this brand.
    const { data: existingPrompt } = await supa
      .from("prompts")
      .select("id")
      .eq("brand_id", brand.id)
      .limit(1)
      .maybeSingle();
    if (!existingPrompt) {
      const { error: pErr } = await supa.from("prompts").insert({
        brand_id: brand.id,
        version: 1,
        body: DEFAULT_PROMPT_BODY,
        is_active: true,
        notes: "Initial seed.",
        edited_by: "system",
      });
      if (pErr) throw new Error(`insert prompt failed: ${pErr.message}`);
      console.log(`  ✓ created prompt v1`);
    } else {
      console.log(`  • prompt already exists (skipped)`);
    }
  }

  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
