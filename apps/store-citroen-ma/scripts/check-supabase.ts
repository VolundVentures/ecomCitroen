import path from "node:path";
import { config as loadEnv } from "dotenv";
loadEnv({ path: path.resolve(__dirname, "..", ".env.local") });
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("missing env");
  const supa = createClient(url, key, { auth: { persistSession: false } });
  console.log("connecting to", url);
  const { error, count } = await supa.from("brands").select("*", { count: "exact", head: true });
  if (error) {
    console.log("ERROR:", error.message);
    if (error.message.includes("does not exist") || error.message.includes("relation")) {
      console.log("\n→ Migration not yet applied. Paste supabase/migrations/00001_init.sql into:");
      console.log("  https://supabase.com/dashboard/project/guibrjhxdtzuvmdrefqg/sql/new");
    }
    process.exit(1);
  }
  console.log(`OK — brands table reachable, ${count ?? 0} rows.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
