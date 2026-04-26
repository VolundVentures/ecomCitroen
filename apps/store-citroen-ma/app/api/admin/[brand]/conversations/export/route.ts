import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { isAuthenticated } from "@/lib/admin-auth";
import type { Brand, Conversation } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

function csvEscape(v: string | number | null | undefined): string {
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
  const sp = req.nextUrl.searchParams;

  const supa = adminClient();
  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = brandRow as unknown as Brand | null;
  if (!brand) return NextResponse.json({ error: "brand not found" }, { status: 404 });

  let q = supa.from("conversations").select("*").eq("brand_id", brand.id).order("started_at", { ascending: false });
  if (sp.get("status")) q = q.eq("status", sp.get("status")!);
  if (sp.get("channel")) q = q.eq("channel", sp.get("channel")!);
  if (sp.get("locale")) q = q.eq("locale", sp.get("locale")!);

  const { data } = await q;
  const convs = (data as unknown as Conversation[]) ?? [];

  const headers = [
    "Started", "Ended", "Channel", "Locale", "Status", "Lead name", "Lead phone", "Lead city", "Lead slot", "Model",
    "Reached usage", "Reached budget", "Reached recommendation", "Captured name", "Captured phone", "Booked",
    "Duration (s)", "Conversation ID",
  ];
  const rows = convs.map((c) => [
    csvEscape(c.started_at),
    csvEscape(c.ended_at),
    csvEscape(c.channel),
    csvEscape(c.locale),
    csvEscape(c.status),
    csvEscape(c.lead_name),
    csvEscape(c.lead_phone),
    csvEscape(c.lead_city),
    csvEscape(c.lead_slot),
    csvEscape(c.lead_model_slug),
    csvEscape(c.reached_usage),
    csvEscape(c.reached_budget),
    csvEscape(c.reached_recommendation),
    csvEscape(c.captured_name),
    csvEscape(c.captured_phone),
    csvEscape(c.booked_test_drive),
    csvEscape(c.duration_seconds),
    csvEscape(c.id),
  ].join(","));
  const csv = [headers.join(","), ...rows].join("\n");

  const filename = `${slug}-conversations-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
