import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { isAuthenticated } from "@/lib/admin-auth";
import type { Brand, Lead } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

function csvEscape(v: string | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brand: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { brand: slug } = await params;
  const status = req.nextUrl.searchParams.get("status");

  const supa = adminClient();
  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = brandRow as unknown as Brand | null;
  if (!brand) return NextResponse.json({ error: "brand not found" }, { status: 404 });

  let q = supa.from("leads").select("*").eq("brand_id", brand.id).order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  const leads = (data as unknown as Lead[]) ?? [];

  const headers = ["First name", "Phone", "Model", "City", "Preferred slot", "Status", "Created at", "Notes", "Conversation ID"];
  const rows = leads.map((l) => [
    csvEscape(l.first_name),
    csvEscape(l.phone),
    csvEscape(l.model_slug),
    csvEscape(l.city),
    csvEscape(l.preferred_slot),
    csvEscape(l.status),
    csvEscape(l.created_at),
    csvEscape(l.notes),
    csvEscape(l.conversation_id),
  ].join(","));
  const csv = [headers.join(","), ...rows].join("\n");

  const filename = `${slug}-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
