// POST /api/salesforce/lead
// Pushes a Jeep test-drive booking into Stellantis Salesforce CRM.
// Currently scoped to brandSlug === "jeep-ma" — other brands are accepted but no-op.

import { NextRequest } from "next/server";
import { submitJeepTestDriveLead } from "@/lib/salesforce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  brandSlug: string;
  firstName: string;
  phone: string;
  lastName?: string;
  email?: string;
  city?: string;
  modelSlug?: string;
  preferredSlot?: string;
  showroom?: string;
  conversationId?: string;
  ticketType?: string;
  leadSource?: string;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.brandSlug || !body.firstName || !body.phone) {
    return Response.json(
      { ok: false, error: "brandSlug, firstName and phone are required" },
      { status: 400 }
    );
  }

  if (body.brandSlug !== "jeep-ma") {
    console.log(`[salesforce/lead] skipped — brandSlug="${body.brandSlug}" (only jeep-ma is wired to Stellantis CRM)`);
    return Response.json(
      { ok: true, skipped: true, reason: "Salesforce sync only enabled for jeep-ma" },
      { status: 200 }
    );
  }

  console.log(
    `[salesforce/lead] → submitting Jeep lead: firstName=${body.firstName} phone=${body.phone} model=${body.modelSlug ?? "—"} city=${body.city ?? "—"} slot=${body.preferredSlot ?? "—"} source=${body.leadSource ?? "chatbot"}`
  );

  try {
    const result = await submitJeepTestDriveLead({
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      email: body.email,
      city: body.city,
      modelSlug: body.modelSlug,
      preferredSlot: body.preferredSlot,
      showroom: body.showroom,
      conversationId: body.conversationId,
      ticketType: body.ticketType,
      leadSource: body.leadSource,
    });
    console.log(
      `[salesforce/lead] ✓ created in Stellantis CRM: id=${result.id} success=${result.success}`
    );
    return Response.json({ ok: true, salesforce: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[salesforce/lead] ✗ failed for firstName=${body.firstName} phone=${body.phone}: ${message}`);
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}
