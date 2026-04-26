// Voice conversation registration. Called by use-rihla-live BEFORE the WS opens.
// Returns the conversation_id the hook then uses to persist transcript chunks.

import { NextRequest } from "next/server";
import { createConversation } from "@/lib/persistence";
import type { Locale } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { brandSlug?: string; locale?: string };
  if (!body.brandSlug || !body.locale) {
    return Response.json({ error: "brandSlug and locale required" }, { status: 400 });
  }
  const id = await createConversation({
    brandSlug: body.brandSlug,
    locale: body.locale as Locale,
    channel: "voice",
    userAgent: req.headers.get("user-agent"),
  });
  return Response.json({ id });
}
