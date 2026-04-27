// Reference-number generator for after-sales tickets.
//
//   RDV-2026-0427-001   service appointment
//   REL-2026-0427-001   complaint (réclamation)
//
// Stable, sortable, customer-friendly. Daily counter resets, padded to 3
// digits — gives us 999 tickets/day before format breaks (more than enough
// for the demo and well above realistic per-brand volume).
//
// We pull the "next sequence" by counting today's existing rows for that
// brand + kind. Race-safe enough for our load — concurrent inserts in the
// same millisecond would still get distinct ref numbers thanks to the
// uniqueness constraint on the column (failed insert → caller retries).

import { adminClient } from "@/lib/supabase/admin";

export type RefKind = "RDV" | "REL";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function pad3(n: number): string {
  if (n < 10) return `00${n}`;
  if (n < 100) return `0${n}`;
  return `${n}`;
}

function todayPrefix(kind: RefKind): { prefix: string; dayStartIso: string; dayEndIso: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad2(now.getMonth() + 1);
  const d = pad2(now.getDate());
  const prefix = `${kind}-${y}-${m}${d}-`;
  const dayStart = new Date(y, now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(y, now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { prefix, dayStartIso: dayStart.toISOString(), dayEndIso: dayEnd.toISOString() };
}

/** Compute the next ref number for a brand + kind by counting today's rows.
 *  Returns null if the Supabase client isn't available (offline demo). */
export async function nextRefNumber(args: {
  brandId: string;
  kind: RefKind;
}): Promise<string> {
  const { kind } = args;
  const { prefix, dayStartIso, dayEndIso } = todayPrefix(kind);

  let count = 0;
  try {
    const supa = adminClient();
    const table = kind === "RDV" ? "service_appointments" : "complaints";
    const { count: c } = await supa
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("brand_id", args.brandId)
      .gte("created_at", dayStartIso)
      .lte("created_at", dayEndIso);
    count = c ?? 0;
  } catch {
    // Offline / Supabase down — fall back to a timestamp-suffixed ref so we
    // still have something unique-looking to show the customer.
    const ms = Date.now() % 1000;
    return `${prefix}${pad3(ms)}`;
  }

  return `${prefix}${pad3(count + 1)}`;
}
