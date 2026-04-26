import path from "node:path";
import { config as loadEnv } from "dotenv";
loadEnv({ path: path.resolve(__dirname, "..", ".env.local") });

async function main() {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw new Error("FIRECRAWL_API_KEY missing");
  const url = process.argv[2] ?? "https://www.citroen.ma/";
  console.log(`Mapping ${url} ...`);
  const res = await fetch("https://api.firecrawl.dev/v1/map", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ url, limit: 50 }),
  });
  console.log("status", res.status);
  const body = await res.text();
  console.log(body.slice(0, 2000));
}
main().catch((e) => { console.error(e); process.exit(1); });
