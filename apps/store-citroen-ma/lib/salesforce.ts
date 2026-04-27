// Salesforce REST integration — OAuth2 password flow + Lead creation.
// Used to push Jeep test-drive bookings into Stellantis CRM.

const SF_AUTH_URL =
  process.env.SF_AUTH_URL ?? "https://login.salesforce.com/services/oauth2/token";
const SF_LEAD_URL =
  process.env.SF_LEAD_URL ??
  "https://stellantis-e.my.salesforce.com/services/data/v54.0/sobjects/Lead";

const TOKEN_SAFETY_WINDOW_MS = 60_000;
const TOKEN_DEFAULT_TTL_SECONDS = 3600;

type CachedToken = { access_token: string; expires_at: number };

let cachedToken: CachedToken | null = null;
let inflightToken: Promise<string> | null = null;

async function fetchNewToken(): Promise<string> {
  const username = process.env.SF_USERNAME;
  const password = process.env.SF_PASSWORD;
  const securityToken = process.env.SF_SECURITY_TOKEN ?? "";
  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;

  if (!username || !password || !clientId || !clientSecret) {
    throw new Error(
      "Missing SF_USERNAME, SF_PASSWORD, SF_CLIENT_ID, or SF_CLIENT_SECRET env var"
    );
  }

  const params = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    client_secret: clientSecret,
    username,
    password: password + securityToken,
  });

  const res = await fetch(SF_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Salesforce token request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  const ttlSeconds =
    typeof data.expires_in === "number" ? data.expires_in : TOKEN_DEFAULT_TTL_SECONDS;
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + ttlSeconds * 1000 - TOKEN_SAFETY_WINDOW_MS,
  };
  return data.access_token;
}

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return cachedToken.access_token;
  }
  if (inflightToken) return inflightToken;
  inflightToken = fetchNewToken().finally(() => {
    inflightToken = null;
  });
  return inflightToken;
}

export interface LeadPayload {
  Salutation: string;
  LastName: string;
  FirstName: string;
  MobilePhone: string;
  Email: string;
  Marque_interet_FB__c: string;
  Modele_d_interet_Text__c: string;
  Showroom_Text__c: string;
  City: string;
  LeadSource: string;
  is_Web__c: boolean;
  Ticket_type__c: string;
  Description: string;
  RecordTypeId: string;
}

export interface SalesforceCreateResponse {
  id: string;
  success: boolean;
  errors: unknown[];
}

async function postLead(token: string, payload: LeadPayload): Promise<Response> {
  return fetch(SF_LEAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Bypass Stellantis "Lead_Duplicate_Rule" — chatbot bookings should always
      // create a record even when a matching lead already exists; the CRM team
      // dedupes downstream.
      "Sforce-Duplicate-Rule-Header": "allowSave=true",
    },
    body: JSON.stringify(payload),
  });
}

export async function createLead(payload: LeadPayload): Promise<SalesforceCreateResponse> {
  const token = await getAccessToken();
  let res = await postLead(token, payload);

  if (res.status === 401) {
    cachedToken = null;
    const freshToken = await getAccessToken();
    res = await postLead(freshToken, payload);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Salesforce lead creation failed (${res.status}): ${text}`);
  }

  return (await res.json()) as SalesforceCreateResponse;
}

// ─── Jeep test-drive helpers ──────────────────────────────────────────────

const JEEP_MODEL_LABELS: Record<string, string> = {
  avenger: "Avenger",
  compass: "Compass",
  "compass-hybrid": "Compass Hybrid",
  "grand-cherokee": "Grand Cherokee",
  renegade: "Renegade",
  "renegade-hybrid": "Renegade Hybrid",
  wrangler: "Wrangler",
};

// Country-code → expected total phone length (per Stellantis validation rules).
const PHONE_LENGTH_BY_PREFIX: Record<string, number> = {
  "+212": 13,
  "+34": 12,
  "+33": 12,
  "+39": 13,
  "+971": 15,
  "+966": 15,
};

/**
 * Normalize a Moroccan-or-international phone string into the +CC format
 * Stellantis CRM validates against. Defaults country code to +212.
 */
export function normalizePhone(raw: string, defaultPrefix = "+212"): string {
  const trimmed = raw.trim();
  let digits = trimmed.replace(/[^\d+]/g, "");

  if (digits.startsWith("00")) digits = "+" + digits.slice(2);

  let prefix = defaultPrefix;
  let local = digits;

  if (digits.startsWith("+")) {
    const match = Object.keys(PHONE_LENGTH_BY_PREFIX).find((p) => digits.startsWith(p));
    if (match) {
      prefix = match;
      local = digits.slice(match.length);
    } else {
      return digits;
    }
  } else if (digits.startsWith("0")) {
    local = digits.slice(1);
  }

  return prefix + local.replace(/\D/g, "");
}

export type JeepTestDriveInput = {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  city?: string;
  modelSlug?: string;
  preferredSlot?: string;
  showroom?: string;
  conversationId?: string;
  /** Optional override; defaults to "Demande de Test Drive". */
  ticketType?: string;
  /** Optional override; defaults to "Avito". Must be a Salesforce-allowed picklist value. */
  leadSource?: string;
};

export function buildJeepLead(input: JeepTestDriveInput): LeadPayload {
  const recordTypeId =
    process.env.SF_RECORD_TYPE_PARTICULIER ?? "0128d000000DtwFAAS";

  const modelLabel = input.modelSlug
    ? JEEP_MODEL_LABELS[input.modelSlug] ?? input.modelSlug
    : "";

  const descriptionLines = [
    `Source: Rihla AI agent (Jeep Maroc demo)`,
    input.preferredSlot ? `Créneau préféré: ${input.preferredSlot}` : null,
    input.modelSlug ? `Modèle: ${modelLabel}` : null,
    input.conversationId ? `Conversation ID: ${input.conversationId}` : null,
  ].filter(Boolean) as string[];

  return {
    Salutation: "Mr.",
    FirstName: input.firstName,
    LastName: input.lastName?.trim() || "(non communiqué)",
    MobilePhone: normalizePhone(input.phone),
    Email: input.email?.trim() || "",
    Marque_interet_FB__c: "Jeep",
    Modele_d_interet_Text__c: modelLabel,
    Showroom_Text__c: input.showroom?.trim() || input.city?.trim() || "",
    City: input.city?.trim() || "",
    LeadSource: input.leadSource ?? "chatbot",
    is_Web__c: true,
    Ticket_type__c: input.ticketType ?? "Demande de Test Drive",
    Description: descriptionLines.join("\n"),
    RecordTypeId: recordTypeId,
  };
}

export async function submitJeepTestDriveLead(
  input: JeepTestDriveInput
): Promise<SalesforceCreateResponse> {
  return createLead(buildJeepLead(input));
}
