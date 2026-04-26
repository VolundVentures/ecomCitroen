// Loads a brand's full runtime context (brand row + active prompt + models)
// for the widget and the chat/voice agent.
//
// Server-only — uses the service-role client to bypass RLS for performance.
// Falls back to local scraped JSONs (scripts/brand-data/*.json) if Supabase is
// unreachable, so a network outage during a demo doesn't 404 the page.

import { promises as fs } from "node:fs";
import path from "node:path";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand, Locale, Model, PromptVersion } from "@/lib/supabase/database.types";
import type { BrandContext } from "@citroen-store/rihla-agent";

export type FullBrandContext = {
  brand: Brand;
  activePrompt: PromptVersion | null;
  models: Model[];
};

// In-process cache. Survives Supabase outages so the demo doesn't 404 mid-pitch.
type CacheEntry = { ctx: FullBrandContext; cachedAt: number };
const brandCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 s — refresh quickly so prompt edits land fast.

/** Fetch the full brand bundle by slug. Falls back to cached data on Supabase failure. */
export async function getBrandContext(slug: string): Promise<FullBrandContext | null> {
  const cached = brandCache.get(slug);
  const fresh = cached && Date.now() - cached.cachedAt < CACHE_TTL_MS;
  if (fresh) return cached.ctx;

  try {
    const supa = adminClient();

    const { data: brandRow, error: bErr } = await supa
      .from("brands")
      .select("*")
      .eq("slug", slug)
      .eq("enabled", true)
      .single();
    if (bErr || !brandRow) {
      // Network / query error: serve stale cache rather than 404.
      if (cached) {
        console.warn(`[brand-context] db error, serving stale cache for ${slug}:`, bErr?.message?.slice(0, 80));
        return cached.ctx;
      }
      return null;
    }
    const brand = brandRow as unknown as Brand;

    const [models, prompt] = await Promise.all([
      supa
        .from("models")
        .select("*")
        .eq("brand_id", brand.id)
        .eq("enabled", true)
        .order("display_order", { ascending: true }),
      supa
        .from("prompts")
        .select("*")
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const ctx: FullBrandContext = {
      brand,
      activePrompt: (prompt.data as unknown as PromptVersion | null) ?? null,
      models: (models.data as unknown as Model[]) ?? [],
    };
    brandCache.set(slug, { ctx, cachedAt: Date.now() });
    return ctx;
  } catch (err) {
    // DNS / fetch failure. Serve stale cache, then JSON fallback, then null.
    if (cached) {
      console.warn(`[brand-context] supabase unreachable, serving stale cache for ${slug}:`, (err as Error).message?.slice(0, 80));
      return cached.ctx;
    }
    const fallback = await loadFromJsonFallback(slug);
    if (fallback) {
      console.warn(`[brand-context] supabase unreachable, serving JSON fallback for ${slug}`);
      brandCache.set(slug, { ctx: fallback, cachedAt: Date.now() });
      return fallback;
    }
    console.warn(`[brand-context] supabase unreachable + no fallback for ${slug}:`, (err as Error).message?.slice(0, 80));
    return null;
  }
}

/** Load brand from the local scraped JSON. Used when Supabase is unreachable. */
async function loadFromJsonFallback(slug: string): Promise<FullBrandContext | null> {
  try {
    const jsonPath = path.resolve(process.cwd(), "scripts", "brand-data", `${slug}.json`);
    const raw = await fs.readFile(jsonPath, "utf-8");
    const data = JSON.parse(raw) as {
      slug: string;
      name: string;
      homepage: string;
      market: string;
      defaultCurrency: string;
      models: Array<{
        slug: string;
        name: string;
        tagline?: string;
        description?: string;
        bodyType?: string;
        priceFrom?: number | null;
        currency?: string | null;
        fuel?: string | null;
        seats?: number | null;
        heroImage?: string;
        galleryImages?: string[];
        keyFeatures?: string[];
        pageUrl?: string;
      }>;
    };

    const fakeId = `fallback-${slug}`;
    const brand: Brand = {
      id: fakeId,
      slug: data.slug,
      name: data.name,
      homepage_url: data.homepage,
      market: data.market,
      default_currency: data.defaultCurrency,
      locales: pickLocalesForMarket(data.market, slug),
      primary_color: pickPrimaryColor(slug),
      logo_url: `/brands/${slug}/logo.svg`,
      agent_name: "Rihla",
      voice_name: "Zephyr",
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const models: Model[] = data.models.map((m, idx) => ({
      id: `${fakeId}-model-${idx}`,
      brand_id: fakeId,
      slug: m.slug,
      name: m.name,
      tagline: m.tagline ?? null,
      description: m.description ?? null,
      body_type: m.bodyType ?? null,
      price_from: m.priceFrom ?? null,
      currency: m.currency ?? data.defaultCurrency,
      fuel: m.fuel ?? null,
      transmission: null,
      seats: m.seats ?? null,
      hero_image_url: m.heroImage ?? "",
      gallery_images: m.galleryImages ?? [],
      key_features: m.keyFeatures ?? [],
      specs: {},
      page_url: m.pageUrl ?? data.homepage,
      enabled: true,
      display_order: idx,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    return { brand, activePrompt: null, models };
  } catch {
    return null;
  }
}

function pickLocalesForMarket(market: string, slug: string): Locale[] {
  if (slug === "peugeot-ksa") return ["ar-SA", "en-SA"];
  if (market === "MA") return ["fr-MA", "ar-MA", "darija-MA"];
  return ["en-MA"];
}

function pickPrimaryColor(slug: string): string {
  if (slug === "citroen-ma") return "#D90030";
  if (slug === "jeep-ma") return "#1A5E2D";
  if (slug === "peugeot-ksa") return "#0E0E10";
  return "#121214";
}

/** Shape a FullBrandContext into the BrandContext the prompt builder expects. */
export function toAgentContext(full: FullBrandContext): BrandContext {
  return {
    brandSlug: full.brand.slug,
    brandName: full.brand.name,
    agentName: full.brand.agent_name,
    market: full.brand.market,
    defaultCurrency: full.brand.default_currency,
    models: full.models.map((m) => ({
      slug: m.slug,
      name: m.name,
      tagline: m.tagline,
      priceFrom: m.price_from,
      currency: m.currency,
      fuel: m.fuel,
      seats: m.seats,
      bodyType: m.body_type,
      keyFeatures: m.key_features,
    })),
  };
}
