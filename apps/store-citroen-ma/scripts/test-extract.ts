import path from "node:path";
import { config as loadEnv } from "dotenv";
loadEnv({ path: path.resolve(__dirname, "..", ".env.local") });
import { scrapeWithSchema } from "./firecrawl";

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    tagline: { type: "string" },
    priceFrom: { type: "number" },
    currency: { type: "string" },
    fuel: { type: "string" },
    seats: { type: "number" },
    heroImage: { type: "string" },
    galleryImages: { type: "array", items: { type: "string" } },
    keyFeatures: { type: "array", items: { type: "string" } },
  },
  required: ["name", "heroImage"],
};

async function main() {
  const url = process.argv[2] ?? "https://www.citroen.ma/vehicules/new-c5-aircross.html";
  console.log("scraping", url);
  const r = await scrapeWithSchema(
    url,
    SCHEMA,
    "Extract the model details (name, price, hero image absolute URL, gallery image absolute URLs)."
  );
  console.log("markdown:", r.markdown.length, "chars");
  console.log("links:", r.links.length);
  console.log("data:", JSON.stringify(r.data, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
