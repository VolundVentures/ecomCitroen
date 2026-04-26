import path from "node:path";
import { config as loadEnv } from "dotenv";
loadEnv({ path: path.resolve(__dirname, "..", ".env.local") });

async function main() {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw new Error("FIRECRAWL_API_KEY missing");
  const url = process.argv[2] ?? "https://www.jeep.com/ma/index.html";
  console.log(`Scraping ${url} ...`);
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ url, formats: ["markdown", "links"], waitFor: 3000, timeout: 60000 }),
  });
  console.log("status", res.status);
  const body = (await res.json()) as { success?: boolean; data?: { markdown?: string; links?: string[] } };
  const links = body.data?.links ?? [];
  console.log(`links: ${links.length}`);
  const filtered = links.filter((l) => l.includes("/ma/") || l.includes("jeep.com"));
  for (const l of filtered.slice(0, 60)) console.log("  ", l);
}
main().catch((e) => { console.error(e); process.exit(1); });
