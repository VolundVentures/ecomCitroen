// Shared APV persistence helpers — used by both /api/rihla/chat and
// /api/rihla/voice/event so service appointments and complaints land in
// Supabase + sync to Stellantis Salesforce no matter which channel triggered
// the tool call. Voice tool calls used to silently no-op for these two tools;
// extracting the logic here closed that gap.

import { createServiceAppointment, createComplaint } from "@/lib/persistence";
import { validatePhone, normalizePhone } from "@/lib/phone";
import { validateEmail } from "@/lib/email";
import { validateVin, normalizeVin } from "@/lib/vin";
import { validateAppointmentDate, validateServiceDate } from "@/lib/dates";
import { nextRefNumber } from "@/lib/reference-number";
import { adminClient } from "@/lib/supabase/admin";
import { submitJeepApvAppointment, submitJeepApvComplaint } from "@/lib/salesforce";

export type ApvPersistResult = {
  ok: boolean;
  refNumber: string;
  summary: Record<string, string | undefined>;
  warnings: string[];
};

export async function persistAppointment(args: {
  brandSlug: string;
  conversationId: string | null;
  input: Record<string, unknown>;
}): Promise<ApvPersistResult> {
  const i = args.input;
  const warnings: string[] = [];

  let brandId = "";
  try {
    const supa = adminClient();
    const { data } = await supa.from("brands").select("id").eq("slug", args.brandSlug).single();
    brandId = (data as unknown as { id?: string } | null)?.id ?? "";
  } catch { /* offline */ }

  const refNumber = brandId
    ? await nextRefNumber({ brandId, kind: "RDV" })
    : `RDV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 999).toString().padStart(3, "0")}`;

  const phoneRaw = String(i.phone ?? "");
  const phone = validatePhone(phoneRaw, "MA");
  if (!phone.ok) warnings.push(`phone-format: ${phone.reason ?? "?"}`);
  const phoneFinal = phone.ok ? phone.canonical : normalizePhone(phoneRaw, "MA");

  const email = validateEmail(String(i.email ?? ""));
  if (!email.ok) warnings.push(`email-format: ${email.reason ?? "?"}`);
  const emailFinal = email.ok ? email.canonical : String(i.email ?? "");

  const vin = validateVin(String(i.vin ?? ""));
  if (!vin.ok) warnings.push(`vin-format: ${vin.reason ?? "?"}`);
  const vinFinal = vin.ok ? vin.canonical : normalizeVin(String(i.vin ?? ""));

  const date = validateAppointmentDate(String(i.preferredDate ?? ""));
  if (!date.ok) warnings.push(`date-${date.reason ?? "?"}`);
  const dateFinal = date.canonical || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const intervention = String(i.interventionType ?? "mechanical") as "mechanical" | "bodywork";
  const slot = String(i.preferredSlot ?? "morning") as "morning" | "afternoon";
  const cndp = i.cndpConsent === true;
  if (!cndp) warnings.push("cndp-missing");

  console.log(
    `[apv/appointment] persist brand=${args.brandSlug} conv=${args.conversationId ?? "n/a"} vin=${vinFinal} model=${String(i.vehicleModel ?? "?")}`
  );

  const persisted = await createServiceAppointment({
    brandSlug: args.brandSlug,
    conversationId: args.conversationId,
    refNumber,
    fullName: String(i.fullName ?? ""),
    phone: phoneFinal,
    email: emailFinal,
    vehicleBrand: String(i.vehicleBrand ?? ""),
    vehicleModel: String(i.vehicleModel ?? ""),
    vin: vinFinal,
    interventionType: intervention,
    city: String(i.city ?? ""),
    preferredDate: dateFinal,
    preferredSlot: slot,
    comment: typeof i.comment === "string" ? i.comment : undefined,
    cndpConsentAt: new Date().toISOString(),
    notes: warnings.length > 0 ? `validation-warnings: ${warnings.join(" · ")}` : undefined,
  });

  // Salesforce Case sync — Jeep only. Fire-and-forget so a slow / failing
  // Stellantis Salesforce never blocks the user-facing booking confirmation.
  if (args.brandSlug === "jeep-ma") {
    void (async () => {
      const finalRef = persisted?.refNumber ?? refNumber;
      try {
        console.log(
          `[salesforce/case] → POST appointment ref=${finalRef} conv=${args.conversationId ?? "n/a"}`
        );
        const { payload, response } = await submitJeepApvAppointment({
          fullName: String(i.fullName ?? ""),
          phone: phoneFinal,
          email: emailFinal,
          vehicleModel: String(i.vehicleModel ?? ""),
          vin: vinFinal,
          interventionType: intervention,
          city: String(i.city ?? ""),
          preferredDate: dateFinal,
          preferredSlot: slot,
          comment: typeof i.comment === "string" ? i.comment : undefined,
          refNumber: finalRef,
          conversationId: args.conversationId,
        });
        console.log("[salesforce/case]   payload:", JSON.stringify(payload, null, 2));
        console.log("[salesforce/case]   response:", JSON.stringify(response, null, 2));
        console.log(
          `[salesforce/case] ✓ Jeep RDV synced: caseId=${response.id} ref=${finalRef} success=${response.success}`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `[salesforce/case] ✗ Jeep RDV sync failed for ref=${finalRef}:`,
          msg
        );
      }
    })();
  }

  return {
    ok: !!persisted,
    refNumber: persisted?.refNumber ?? refNumber,
    summary: {
      fullName: String(i.fullName ?? ""),
      phone: phoneFinal,
      email: emailFinal,
      vehicleBrand: String(i.vehicleBrand ?? ""),
      vehicleModel: String(i.vehicleModel ?? ""),
      vin: vinFinal,
      interventionType: intervention,
      city: String(i.city ?? ""),
      preferredDate: dateFinal,
      preferredSlot: slot,
    },
    warnings,
  };
}

export async function persistComplaint(args: {
  brandSlug: string;
  conversationId: string | null;
  input: Record<string, unknown>;
}): Promise<ApvPersistResult> {
  const i = args.input;
  const warnings: string[] = [];

  let brandId = "";
  try {
    const supa = adminClient();
    const { data } = await supa.from("brands").select("id").eq("slug", args.brandSlug).single();
    brandId = (data as unknown as { id?: string } | null)?.id ?? "";
  } catch { /* offline */ }

  const refNumber = brandId
    ? await nextRefNumber({ brandId, kind: "REL" })
    : `REL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 999).toString().padStart(3, "0")}`;

  const phone = validatePhone(String(i.phone ?? ""), "MA");
  if (!phone.ok) warnings.push(`phone-format: ${phone.reason ?? "?"}`);
  const phoneFinal = phone.ok ? phone.canonical : normalizePhone(String(i.phone ?? ""), "MA");

  const email = validateEmail(String(i.email ?? ""));
  if (!email.ok) warnings.push(`email-format: ${email.reason ?? "?"}`);
  const emailFinal = email.ok ? email.canonical : String(i.email ?? "");

  const vin = validateVin(String(i.vin ?? ""));
  if (!vin.ok) warnings.push(`vin-format: ${vin.reason ?? "?"}`);
  const vinFinal = vin.ok ? vin.canonical : normalizeVin(String(i.vin ?? ""));

  let serviceDateFinal: string | null = null;
  if (typeof i.serviceDate === "string" && i.serviceDate.trim()) {
    const sd = validateServiceDate(i.serviceDate);
    if (!sd.ok) warnings.push(`service-date-${sd.reason ?? "?"}`);
    serviceDateFinal = sd.canonical || null;
  }

  const reason = String(i.reason ?? "").trim();
  if (reason.length < 20) warnings.push("reason-too-short");

  const intervention = String(i.interventionType ?? "mechanical") as "mechanical" | "bodywork";
  const cndp = i.cndpConsent === true;
  if (!cndp) warnings.push("cndp-missing");

  console.log(
    `[apv/complaint] persist brand=${args.brandSlug} conv=${args.conversationId ?? "n/a"} vin=${vinFinal} site=${String(i.site ?? "?")}`
  );

  const persisted = await createComplaint({
    brandSlug: args.brandSlug,
    conversationId: args.conversationId,
    refNumber,
    fullName: String(i.fullName ?? ""),
    phone: phoneFinal,
    email: emailFinal,
    vehicleBrand: String(i.vehicleBrand ?? ""),
    vehicleModel: String(i.vehicleModel ?? ""),
    vin: vinFinal,
    interventionType: intervention,
    site: String(i.site ?? ""),
    serviceDate: serviceDateFinal,
    reason,
    attachmentUrl: typeof i.attachmentUrl === "string" ? i.attachmentUrl : undefined,
    cndpConsentAt: new Date().toISOString(),
    crcNotes: warnings.length > 0 ? `validation-warnings: ${warnings.join(" · ")}` : undefined,
  });

  if (args.brandSlug === "jeep-ma") {
    void (async () => {
      const finalRef = persisted?.refNumber ?? refNumber;
      try {
        console.log(
          `[salesforce/case] → POST complaint ref=${finalRef} conv=${args.conversationId ?? "n/a"}`
        );
        const { payload, response } = await submitJeepApvComplaint({
          fullName: String(i.fullName ?? ""),
          phone: phoneFinal,
          email: emailFinal,
          vehicleModel: String(i.vehicleModel ?? ""),
          vin: vinFinal,
          interventionType: intervention,
          site: String(i.site ?? ""),
          serviceDate: serviceDateFinal,
          reason,
          attachmentUrl: typeof i.attachmentUrl === "string" ? i.attachmentUrl : undefined,
          refNumber: finalRef,
          conversationId: args.conversationId,
        });
        console.log("[salesforce/case]   payload:", JSON.stringify(payload, null, 2));
        console.log("[salesforce/case]   response:", JSON.stringify(response, null, 2));
        console.log(
          `[salesforce/case] ✓ Jeep réclamation synced: caseId=${response.id} ref=${finalRef} success=${response.success}`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `[salesforce/case] ✗ Jeep réclamation sync failed for ref=${finalRef}:`,
          msg
        );
      }
    })();
  }

  return {
    ok: !!persisted,
    refNumber: persisted?.refNumber ?? refNumber,
    summary: {
      fullName: String(i.fullName ?? ""),
      phone: phoneFinal,
      email: emailFinal,
      vehicleBrand: String(i.vehicleBrand ?? ""),
      vehicleModel: String(i.vehicleModel ?? ""),
      vin: vinFinal,
      interventionType: intervention,
      site: String(i.site ?? ""),
      serviceDate: serviceDateFinal ?? undefined,
      reason: reason.slice(0, 100),
    },
    warnings,
  };
}
