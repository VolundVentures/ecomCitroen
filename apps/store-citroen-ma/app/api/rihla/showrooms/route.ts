// /api/rihla/showrooms?brand=jeep-ma&city=Casablanca
// Returns the closest showrooms for a given brand + city. If no city match,
// returns all showrooms for the brand sorted by primary_dealer first.

import { NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ShowroomRow = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  hours: string | null;
  service_centre: boolean;
  primary_dealer: boolean;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("brand");
  const city = (url.searchParams.get("city") ?? "").trim();
  if (!slug) return Response.json({ items: [] }, { status: 400 });

  try {
    const supa = adminClient();
    const { data: brandRow } = await supa.from("brands").select("id").eq("slug", slug).single();
    const brandId = (brandRow as { id?: string } | null)?.id;
    if (!brandId) return Response.json({ items: [] });

    let q = supa
      .from("showrooms")
      .select("id, name, city, address, phone, whatsapp, email, hours, service_centre, primary_dealer")
      .eq("brand_id", brandId)
      .eq("enabled", true);
    if (city) {
      // Case-insensitive city match — also fuzzy on prefix.
      q = q.ilike("city", `%${city}%`);
    }
    q = q.order("primary_dealer", { ascending: false }).order("name");
    const { data } = await q;
    const items = (data as unknown as ShowroomRow[]) ?? [];
    return Response.json({ items, city: city || null });
  } catch (err) {
    console.warn("[showrooms] failed:", (err as Error).message?.slice(0, 100));
    return Response.json({ items: [] });
  }
}
