// VIN (Vehicle Identification Number) validation per ISO 3779 and the
// Stellantis APV spec:
//   - 17 characters total
//   - Alphanumeric only
//   - Letters I, O, Q EXCLUDED (they look like 1 / 0 / 0 — exclusion is
//     mandated by the standard)
//
// Returns uppercase canonical form when valid; the trimmed input + reason
// when not.

export type VinValidation = {
  ok: boolean;
  canonical: string;
  reason?: string;
};

const RE = /^[A-HJ-NPR-Z0-9]{17}$/;

export function validateVin(raw: string): VinValidation {
  if (!raw || typeof raw !== "string") {
    return { ok: false, canonical: raw ?? "", reason: "missing" };
  }
  const cleaned = raw.replace(/\s+/g, "").toUpperCase();
  if (cleaned.length !== 17) {
    return {
      ok: false,
      canonical: cleaned,
      reason: cleaned.length < 17 ? "too-short" : "too-long",
    };
  }
  if (!RE.test(cleaned)) {
    return { ok: false, canonical: cleaned, reason: "invalid-chars" };
  }
  return { ok: true, canonical: cleaned };
}

/** Loose helper for checking BEFORE persisting. Strips spaces, uppercases.
 *  Use validateVin() for strict ok/reason. */
export function normalizeVin(raw: string): string {
  if (!raw) return raw;
  return raw.replace(/\s+/g, "").toUpperCase();
}
