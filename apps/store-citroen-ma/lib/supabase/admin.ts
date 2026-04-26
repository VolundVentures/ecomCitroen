// Service-role Supabase client. Bypasses RLS. SERVER USE ONLY.
// Never import this from a client component or expose the key to the browser.
//
// We type the client as `any` for query operations because we don't currently
// generate TS types from the schema (would require `supabase gen types`).
// All callers cast the returned rows to typed shapes from database.types.ts.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function adminClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase URL or SUPABASE_SERVICE_ROLE_KEY missing in env");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "rihla-admin" } },
  });
  return cached;
}
