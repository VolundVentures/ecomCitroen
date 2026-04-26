// Loads a brand's full runtime context (brand row + active prompt + models)
// for the widget and the chat/voice agent.
//
// Server-only — uses the service-role client to bypass RLS for performance,
// but the same data is also fetchable via anon for public reads.

import { adminClient } from "@/lib/supabase/admin";
import type { Brand, Model, PromptVersion } from "@/lib/supabase/database.types";
import type { BrandContext } from "@citroen-store/rihla-agent";

export type FullBrandContext = {
  brand: Brand;
  activePrompt: PromptVersion | null;
  models: Model[];
};

/** Fetch the full brand bundle by slug. Returns null if brand is unknown/disabled. */
export async function getBrandContext(slug: string): Promise<FullBrandContext | null> {
  const supa = adminClient();

  const { data: brandRow, error: bErr } = await supa
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .eq("enabled", true)
    .single();
  if (bErr || !brandRow) return null;
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

  return {
    brand,
    activePrompt: (prompt.data as unknown as PromptVersion | null) ?? null,
    models: (models.data as unknown as Model[]) ?? [],
  };
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
