/**
 * Download all model images from scraped JSON to local disk.
 *
 * Why local: brand-site CDNs may block hotlinking via Referer or rate-limit,
 * and we need the images to render fast inside the chat widget. We mirror
 * them under public/brands/{brandSlug}/{modelSlug}/ and rewrite the JSON
 * so the local paths are what gets seeded into Supabase.
 *
 * Usage:
 *   pnpm tsx scripts/download-images.ts                # all brands
 *   pnpm tsx scripts/download-images.ts citroen-ma     # one brand
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import "dotenv/config";

type Model = {
  slug: string;
  name: string;
  heroImage?: string;
  galleryImages?: string[];
  [k: string]: unknown;
};
type BrandPayload = {
  slug: string;
  name: string;
  models: Model[];
  [k: string]: unknown;
};

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "scripts", "brand-data");
const PUBLIC_DIR = path.join(ROOT, "public", "brands");

function extOf(url: string): string {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\.([a-z0-9]+)$/i);
    if (m) {
      const ext = m[1]!.toLowerCase();
      if (["jpg", "jpeg", "png", "webp", "avif", "gif"].includes(ext)) return ext;
    }
  } catch {
    /* ignore */
  }
  return "jpg";
}

async function downloadOne(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      console.warn(`    ✗ ${res.status} ${url.slice(0, 80)}`);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(destPath, buf);
    return true;
  } catch (err) {
    console.warn(`    ✗ ${(err as Error).message.slice(0, 80)}`);
    return false;
  }
}

async function downloadBrand(slug: string): Promise<void> {
  const dataFile = path.join(DATA_DIR, `${slug}.json`);
  const raw = await fs.readFile(dataFile, "utf8");
  const payload = JSON.parse(raw) as BrandPayload;
  const brandDir = path.join(PUBLIC_DIR, slug);
  await fs.mkdir(brandDir, { recursive: true });

  console.log(`\n=== ${payload.name} (${slug}) ===`);
  for (const model of payload.models) {
    const modelDir = path.join(brandDir, model.slug);
    await fs.mkdir(modelDir, { recursive: true });
    console.log(`  ${model.name} (${model.slug})`);

    // Hero
    if (model.heroImage) {
      const ext = extOf(model.heroImage);
      const dest = path.join(modelDir, `hero.${ext}`);
      const ok = await downloadOne(model.heroImage, dest);
      if (ok) {
        model.heroImage = `/brands/${slug}/${model.slug}/hero.${ext}`;
        console.log(`    ✓ hero.${ext}`);
      }
    }
    // Gallery
    const newGallery: string[] = [];
    if (Array.isArray(model.galleryImages)) {
      for (let i = 0; i < model.galleryImages.length; i++) {
        const remote = model.galleryImages[i]!;
        const ext = extOf(remote);
        const dest = path.join(modelDir, `gallery-${i + 1}.${ext}`);
        const ok = await downloadOne(remote, dest);
        if (ok) {
          newGallery.push(`/brands/${slug}/${model.slug}/gallery-${i + 1}.${ext}`);
          console.log(`    ✓ gallery-${i + 1}.${ext}`);
        }
      }
      model.galleryImages = newGallery;
    }
  }

  // Persist the rewritten JSON with local paths.
  await fs.writeFile(dataFile, JSON.stringify(payload, null, 2), "utf8");
  console.log(`✓ rewrote ${dataFile} with local paths`);
}

async function main() {
  const onlySlug = process.argv[2];
  const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));
  const slugs = files.map((f) => f.replace(/\.json$/, ""));
  const targets = onlySlug ? slugs.filter((s) => s === onlySlug) : slugs;
  if (targets.length === 0) {
    console.error(`No brand-data files found${onlySlug ? ` for ${onlySlug}` : ""}.`);
    process.exit(1);
  }
  for (const slug of targets) await downloadBrand(slug);
}

main().catch((e) => { console.error(e); process.exit(1); });
