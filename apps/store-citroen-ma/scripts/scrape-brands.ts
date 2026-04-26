/**
 * Scrape Jeep Maroc, Citroën Maroc, and Peugeot KSA via Firecrawl.
 *
 * Usage:
 *   pnpm tsx scripts/scrape-brands.ts                   # scrape all 3
 *   pnpm tsx scripts/scrape-brands.ts jeep-ma           # one brand
 *
 * Output: scripts/brand-data/{slug}.json with full model data + image URLs.
 * Images stay remote at this stage; a separate step downloads them locally.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: path.resolve(__dirname, "..", ".env.local") });
import { mapSite, scrapeMarkdown, scrapeWithSchema } from "./firecrawl";

type BrandSpec = {
  slug: "jeep-ma" | "citroen-ma" | "peugeot-ksa";
  name: string;
  homepage: string;
  /** Used by Firecrawl /map's `search` parameter to filter URLs. */
  modelHints: string[];
  /** URL substrings that almost certainly are model pages. */
  modelPathPatterns: RegExp[];
  /** URL substrings to drop even if they look like model pages. */
  excludePatterns: RegExp[];
  market: "MA" | "SA";
  defaultCurrency: "MAD" | "SAR";
};

const BRANDS: BrandSpec[] = [
  {
    slug: "jeep-ma",
    name: "Jeep Maroc",
    homepage: "https://www.jeep.com/ma/index.html",
    modelHints: ["wrangler", "compass", "renegade", "grand-cherokee", "avenger"],
    modelPathPatterns: [
      // Jeep Maroc URLs follow /ma/{year}/jeep-{model}/{variant}.html
      /\/ma\/\d{4}\/jeep-[a-z-]+\//i,
      /\/ma\/\d{4}\/(compass|wrangler|renegade|grand-cherokee|avenger|gladiator)/i,
    ],
    excludePatterns: [
      /legal|privacy|terms|cookie|find-dealer|schedule|after-sales|jeep-life|history|news|promotion|get-a-quote|content\/cross-regional/i,
    ],
    market: "MA",
    defaultCurrency: "MAD",
  },
  {
    slug: "citroen-ma",
    name: "Citroën Maroc",
    homepage: "https://www.citroen.ma/",
    modelHints: ["c3", "c4", "c5", "berlingo", "spacetourer"],
    modelPathPatterns: [
      /\/vehicules\/(nouvelle-c3|nouveau-suv-c3-aircross|new-c5-aircross|c5-aircross-suv|new-citroen-c4|c4-x|c-elysee|new-berlingo|nouveau-berlingo|spacetourer|ami)(\.html)?$/i,
    ],
    excludePatterns: [
      /legal|privacy|terms|cookie|contact|services?|news|finance|configurateur|configurator|advisor|categorie|utilitaires|futurs|lp-test|business-lounge/i,
    ],
    market: "MA",
    defaultCurrency: "MAD",
  },
  {
    slug: "peugeot-ksa",
    name: "Peugeot KSA",
    homepage: "https://ksa.peugeot.com/en/",
    modelHints: ["208", "2008", "3008", "5008", "508", "408", "landtrek", "expert", "partner", "traveller", "boxer"],
    modelPathPatterns: [
      // Peugeot KSA URLs are .../our-models/{name}.html with various sub-variants
      /\/en\/our-models\/(new-peugeot-)?(208|2008|3008|5008|508|408|landtrek|expert|partner|traveller|boxer|rifter|new-)[a-z0-9-]*(\.html)?$/i,
      /\/en\/our-models\/(new-peugeot-208|new-peugeot-208\.html|2008\.html|peugeot-3008\/all-new\.html|new-peugeot-5008\/all-new\.html|new-408\.html|peugeot-408\.html)$/i,
    ],
    excludePatterns: [
      /legal|privacy|terms|cookie|contact|finance|after-sales|owners|news|category|configurator|advisor|customer-reviews|test-advisor|old/i,
    ],
    market: "SA",
    defaultCurrency: "SAR",
  },
];

const MODEL_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", description: "Model name as it appears on the page (e.g. 'Wrangler', 'C3 Aircross')." },
    tagline: { type: "string", description: "Short marketing tagline if present (one short sentence)." },
    description: { type: "string", description: "1-2 sentence summary of the model." },
    bodyType: { type: "string", description: "SUV, hatchback, sedan, MPV, etc." },
    priceFrom: {
      type: "number",
      description: "Starting price as a number, no currency symbol. Null if not shown.",
    },
    currency: { type: "string", description: "MAD or SAR." },
    fuel: { type: "string", description: "Petrol, Diesel, Hybrid, PHEV, Electric, etc." },
    transmission: { type: "string", description: "Manual or Automatic." },
    seats: { type: "number", description: "Number of seats." },
    heroImage: { type: "string", description: "Main hero image absolute URL." },
    galleryImages: {
      type: "array",
      items: { type: "string" },
      description: "Up to 6 additional gallery image absolute URLs of this model.",
    },
    keyFeatures: {
      type: "array",
      items: { type: "string" },
      description: "3 to 6 short marketing bullet points about the model.",
    },
    specs: {
      type: "object",
      description: "Headline specs as flat key/value strings (engine, power, fuel-economy, trunk, etc.).",
      additionalProperties: { type: "string" },
    },
  },
  required: ["name", "heroImage"],
} as const;

type ScrapedModel = {
  name?: string;
  tagline?: string;
  description?: string;
  bodyType?: string;
  priceFrom?: number | null;
  currency?: string;
  fuel?: string;
  transmission?: string;
  seats?: number | null;
  heroImage?: string;
  galleryImages?: string[];
  keyFeatures?: string[];
  specs?: Record<string, string>;
};

type BrandPayload = {
  slug: string;
  name: string;
  homepage: string;
  market: string;
  defaultCurrency: string;
  scrapedAt: string;
  models: Array<
    ScrapedModel & {
      slug: string;
      pageUrl: string;
    }
  >;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isModelUrl(spec: BrandSpec, url: string): boolean {
  if (spec.excludePatterns.some((re) => re.test(url))) return false;
  return spec.modelPathPatterns.some((re) => re.test(url));
}

// Free-tier rate limit is 6 req/min, so we throttle to roughly that.
const SLEEP_MS = 11_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function discoverModelUrls(spec: BrandSpec): Promise<string[]> {
  const seen = new Set<string>();
  // /map first — fast, sitemap-based, usually all we need.
  try {
    const links = await mapSite(spec.homepage);
    for (const l of links) {
      if (isModelUrl(spec, l)) seen.add(l);
    }
    console.log(`  [map] found ${seen.size} candidates`);
  } catch (err) {
    console.warn(`  [map] failed:`, (err as Error).message.slice(0, 120));
  }
  // /scrape fallback: render the homepage and harvest links from the DOM.
  // Catches JS-rendered nav menus that /map misses (Jeep Maroc).
  if (seen.size < 3) {
    await sleep(SLEEP_MS);
    try {
      const { links } = await scrapeMarkdown(spec.homepage);
      for (const l of links) {
        if (isModelUrl(spec, l)) seen.add(l);
      }
      console.log(`  [scrape-home] now ${seen.size} candidates`);
    } catch (err) {
      console.warn(`  [scrape-home] failed:`, (err as Error).message.slice(0, 120));
    }
  }
  return [...seen];
}

/**
 * Map a URL to a normalized "model family" key so we can collapse multiple
 * variants of the same model (e.g. /c5-aircross-suv vs /new-c5-aircross,
 * /jeep-avenger/4xe vs /jeep-avenger/new-jeep-avenger) onto one canonical entry.
 */
const MODEL_TOKENS = [
  // Jeep
  "grand-cherokee",
  "avenger",
  "wrangler",
  "compass",
  "renegade",
  "gladiator",
  // Citroën
  "c3-aircross",
  "c5-aircross",
  "c4-x",
  "berlingo",
  "spacetourer",
  "c-elysee",
  "c3",
  "c4",
  "c5",
  "ami",
  // Peugeot
  "5008",
  "3008",
  "2008",
  "508",
  "408",
  "208",
  "landtrek",
  "traveller",
  "expert",
  "partner",
  "boxer",
  "rifter",
];

function modelKey(url: string): string {
  const u = url.toLowerCase();
  for (const t of MODEL_TOKENS) {
    // Avoid `c3` matching inside `c3-aircross` and `208` matching inside `2008` —
    // the more specific tokens come first in the array, so once one matches we win.
    if (u.includes(t)) return t;
  }
  return u;
}

/** Pick the canonical URL per model family. Prefer "new-" variants and shorter paths. */
function dedupeModels(urls: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const u of urls) {
    const k = modelKey(u);
    const cur = byKey.get(k);
    if (!cur) {
      byKey.set(k, u);
      continue;
    }
    // Prefer "new-" variants; otherwise prefer the shortest URL (canonical).
    const score = (x: string) =>
      (x.includes("/new-") || x.includes("nouvelle-") || x.includes("nouveau-") ? 0 : 1) * 100 + x.length;
    if (score(u) < score(cur)) byKey.set(k, u);
  }
  return [...byKey.values()];
}

async function scrapeBrand(spec: BrandSpec): Promise<BrandPayload> {
  console.log(`\n=== ${spec.name} (${spec.slug}) ===`);
  console.log("Discovering model URLs...");
  const raw = await discoverModelUrls(spec);
  const urls = dedupeModels(raw);
  console.log(`  Found ${raw.length} candidates → ${urls.length} after dedupe`);
  for (const u of urls) console.log(`   - ${u}`);

  const models: BrandPayload["models"] = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]!;
    if (i > 0) await sleep(SLEEP_MS);
    process.stdout.write(`  scraping ${url} ... `);
    try {
      const { data } = await scrapeWithSchema<ScrapedModel>(
        url,
        MODEL_SCHEMA,
        `Extract details about THIS specific model only.
- name: the model name as shown on this page (e.g. "Wrangler", "C3 Aircross", "Peugeot 208").
- heroImage: the largest absolute URL of THIS model's main hero photo. NOT a logo, NOT a thumbnail.
- galleryImages: up to 6 absolute URLs of additional photos of THIS model only — exterior, interior, dashboard.
- IMPORTANT: SKIP all cross-sell sections, "other models" carousels, related models, and any images that are not of this specific model.
- priceFrom: numeric starting price (no currency symbol). Null if unknown.
- specs: flat key/value strings — engine, power, fuel-economy, trunk-volume, etc.
- keyFeatures: 3 to 6 short marketing bullets specific to this model.`
      );
      if (!data || !data.name || !data.heroImage) {
        console.log("skipped (no data)");
        continue;
      }
      // Use the canonical model token (wrangler / c3-aircross / 5008) as the slug
      // when we can detect it from the URL — falls back to a slugified name.
      const detected = modelKey(url);
      const slug = detected !== url.toLowerCase() ? detected : slugify(data.name);
      models.push({
        ...data,
        slug,
        pageUrl: url,
        currency: data.currency ?? spec.defaultCurrency,
      });
      console.log(`ok → ${data.name} (${slug})`);
    } catch (err) {
      console.log(`failed: ${(err as Error).message.slice(0, 80)}`);
    }
  }

  return {
    slug: spec.slug,
    name: spec.name,
    homepage: spec.homepage,
    market: spec.market,
    defaultCurrency: spec.defaultCurrency,
    scrapedAt: new Date().toISOString(),
    models,
  };
}

async function main() {
  const onlySlug = process.argv[2];
  const targets = onlySlug ? BRANDS.filter((b) => b.slug === onlySlug) : BRANDS;
  if (targets.length === 0) {
    console.error(`Unknown brand slug: ${onlySlug}`);
    process.exit(1);
  }
  const outDir = path.resolve(__dirname, "brand-data");
  await fs.mkdir(outDir, { recursive: true });

  for (const spec of targets) {
    const payload = await scrapeBrand(spec);
    const file = path.join(outDir, `${spec.slug}.json`);
    await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
    console.log(`✓ wrote ${file} (${payload.models.length} models)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
