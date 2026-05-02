/**
 * Submit a fake Jeep APV ticket directly to Stellantis Salesforce —
 * useful for iterating on the Case schema without doing a full chatbot run.
 *
 * Usage:
 *   pnpm tsx scripts/test-jeep-case.ts             # → RDV (appointment)
 *   pnpm tsx scripts/test-jeep-case.ts complaint   # → Réclamation
 *   pnpm tsx scripts/test-jeep-case.ts payload     # → only print payload, do NOT submit
 *
 * The script reads SF_* credentials from apps/store-citroen-ma/.env.local
 * (same as the running Next dev server) and prints the full payload + the
 * Salesforce response (id / success / errors).
 */

import path from "node:path";
import { config as loadEnv } from "dotenv";
loadEnv({ path: path.resolve(__dirname, "..", ".env.local") });

import {
  buildJeepApvAppointmentCase,
  buildJeepApvComplaintCase,
  submitJeepApvAppointment,
  submitJeepApvComplaint,
  getAccessToken,
} from "../lib/salesforce";

const APPOINTMENT_INPUT = {
  fullName: "Mohammed Test",
  phone: "0612345678",
  email: "test+rdv@example.com",
  vehicleModel: "avenger",
  vin: "ZFA12345678901234", // 17 chars, no I/O/Q
  interventionType: "mechanical" as const,
  city: "Casablanca",
  preferredDate: "2026-05-15",
  preferredSlot: "morning" as const,
  comment: "Bruit suspect au freinage. Test depuis script CLI.",
  refNumber: `RDV-TEST-${Date.now().toString(36)}`,
  conversationId: `cli-${new Date().toISOString().slice(0, 10)}`,
};

const COMPLAINT_INPUT = {
  fullName: "Mohammed Test",
  phone: "0612345678",
  email: "test+rec@example.com",
  vehicleModel: "wrangler",
  vin: "ZFA12345678901234",
  interventionType: "bodywork" as const,
  site: "Casablanca",
  serviceDate: "2026-04-20",
  reason:
    "La peinture de la portière arrière droite présente des défauts visibles deux semaines après la livraison. Test depuis script CLI.",
  refNumber: `REL-TEST-${Date.now().toString(36)}`,
  conversationId: `cli-${new Date().toISOString().slice(0, 10)}`,
};

async function main() {
  const mode = process.argv[2] ?? "rdv";

  // Fail fast if creds aren't loaded — prevents a confusing 401.
  const requiredEnv = ["SF_USERNAME", "SF_PASSWORD", "SF_CLIENT_ID", "SF_CLIENT_SECRET"];
  const missing = requiredEnv.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(
      `[test-jeep-case] ✗ Missing env: ${missing.join(", ")}. Check apps/store-citroen-ma/.env.local`
    );
    process.exit(1);
  }

  if (mode === "payload") {
    console.log("─── APPOINTMENT PAYLOAD ───");
    console.log(JSON.stringify(buildJeepApvAppointmentCase(APPOINTMENT_INPUT), null, 2));
    console.log("\n─── COMPLAINT PAYLOAD ───");
    console.log(JSON.stringify(buildJeepApvComplaintCase(COMPLAINT_INPUT), null, 2));
    return;
  }

  if (mode === "record-types" || mode === "rt") {
    // Discover the actual Case RecordTypes available to the integration user.
    // The NBS doc lists hardcoded IDs that may be stale or not granted to this
    // user's profile — INVALID_CROSS_REFERENCE_KEY usually means exactly that.
    const baseUrl = (process.env.SF_CASE_URL ??
      "https://stellantis-e.my.salesforce.com/services/data/v54.0/sobjects/Case")
      .replace(/\/sobjects\/Case\/?$/, "");
    const queryUrl = `${baseUrl}/query/?q=${encodeURIComponent(
      "SELECT Id, Name, DeveloperName, IsActive FROM RecordType WHERE SObjectType = 'Case' ORDER BY DeveloperName"
    )}`;
    const token = await getAccessToken();
    const res = await fetch(queryUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(`[test-jeep-case] ✗ Query failed (${res.status}): ${await res.text()}`);
      process.exit(1);
    }
    const data = (await res.json()) as {
      totalSize: number;
      records: Array<{ Id: string; Name: string; DeveloperName: string; IsActive: boolean }>;
    };
    console.log(`─── CASE RECORD TYPES (${data.totalSize}) ───`);
    if (data.totalSize === 0) {
      console.log("(none — the integration user has no RecordType permissions on Case)");
    }
    for (const rt of data.records) {
      const flag = rt.IsActive ? "✓" : "✗";
      console.log(`  ${flag}  ${rt.Id}  DeveloperName="${rt.DeveloperName}"  Name="${rt.Name}"`);
    }
    console.log(
      "\nUse one of the IDs above as RecordTypeId in CasePayload. Look for DeveloperName matching RDV/SAV, Reclamation/SAV, etc."
    );
    return;
  }

  if (mode === "complaint" || mode === "rec" || mode === "reclamation") {
    console.log(`[test-jeep-case] → POST complaint ref=${COMPLAINT_INPUT.refNumber}`);
    console.log("─── PAYLOAD ───");
    console.log(JSON.stringify(buildJeepApvComplaintCase(COMPLAINT_INPUT), null, 2));
    try {
      const { response } = await submitJeepApvComplaint(COMPLAINT_INPUT);
      console.log("─── RESPONSE ───");
      console.log(JSON.stringify(response, null, 2));
      console.log(`[test-jeep-case] ✓ Case created: id=${response.id} success=${response.success}`);
    } catch (err) {
      console.error("─── ERROR ───");
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
    return;
  }

  // Default: RDV / appointment
  console.log(`[test-jeep-case] → POST appointment ref=${APPOINTMENT_INPUT.refNumber}`);
  console.log("─── PAYLOAD ───");
  console.log(JSON.stringify(buildJeepApvAppointmentCase(APPOINTMENT_INPUT), null, 2));
  try {
    const { response } = await submitJeepApvAppointment(APPOINTMENT_INPUT);
    console.log("─── RESPONSE ───");
    console.log(JSON.stringify(response, null, 2));
    console.log(`[test-jeep-case] ✓ Case created: id=${response.id} success=${response.success}`);
  } catch (err) {
    console.error("─── ERROR ───");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
