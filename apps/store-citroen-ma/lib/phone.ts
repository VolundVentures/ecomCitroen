// Mobile-number normalization + validation per market.
//
// MA (Morocco):  06 / 07 + 8 digits, OR +212 6/7 + 8 digits.   10 digits canonical.
// SA (KSA):      05      + 8 digits, OR +966 5  + 8 digits.    10 digits canonical.
//
// We accept any common input format (spaces, dashes, dots, parens, leading +
// or 00, with or without country code) and produce a canonical international
// form like "+212 661 22 33 44" / "+966 50 123 4567" for storage.

export type PhoneMarket = "MA" | "SA";

export type PhoneValidation = {
  ok: boolean;
  /** International form ("+212 661 22 33 44") when ok. The raw input when not. */
  canonical: string;
  /** Concise reason, in the customer's language family (en / fr / ar). */
  reason?: string;
};

/** Strip everything that isn't a digit or a leading `+`. */
function strip(raw: string): string {
  const trimmed = raw.trim();
  // Convert leading 00 to +.
  const replaced = trimmed.replace(/^00/, "+");
  return replaced.replace(/[^\d+]/g, "");
}

/** Format a 10-digit national MA mobile (06xxxxxxxx) as +212 6XX XX XX XX. */
function formatMA(localTen: string): string {
  // localTen: 06xxxxxxxx → drop leading 0, prefix +212
  const rest = localTen.slice(1); // 6xxxxxxxx
  return `+212 ${rest.slice(0, 3)} ${rest.slice(3, 5)} ${rest.slice(5, 7)} ${rest.slice(7, 9)}`;
}

/** Format a 10-digit national KSA mobile (05xxxxxxxx) as +966 5X XXX XXXX. */
function formatSA(localTen: string): string {
  const rest = localTen.slice(1); // 5xxxxxxxx
  return `+966 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 9)}`;
}

export function validatePhone(raw: string, market: PhoneMarket): PhoneValidation {
  if (!raw || typeof raw !== "string") {
    return { ok: false, canonical: raw ?? "", reason: "missing" };
  }
  const cleaned = strip(raw);

  // Pull a candidate national number out of the cleaned form.
  // Accept formats: +212XXXXXXXXX, 212XXXXXXXXX, 0XXXXXXXXX, XXXXXXXXX
  let national: string | null = null;

  if (market === "MA") {
    if (cleaned.startsWith("+212")) {
      const tail = cleaned.slice(4);
      if (/^[67]\d{8}$/.test(tail)) national = "0" + tail;
    } else if (cleaned.startsWith("212")) {
      const tail = cleaned.slice(3);
      if (/^[67]\d{8}$/.test(tail)) national = "0" + tail;
    } else if (cleaned.startsWith("+")) {
      // wrong country prefix
    } else if (/^0[67]\d{8}$/.test(cleaned)) {
      national = cleaned;
    } else if (/^[67]\d{8}$/.test(cleaned)) {
      national = "0" + cleaned;
    }
    if (!national) {
      return {
        ok: false,
        canonical: raw,
        reason: "Le numéro doit être un mobile marocain — 06 ou 07 suivi de 8 chiffres, ou +212 6/7 et 8 chiffres.",
      };
    }
    return { ok: true, canonical: formatMA(national) };
  }

  // KSA
  if (market === "SA") {
    if (cleaned.startsWith("+966")) {
      const tail = cleaned.slice(4);
      if (/^5\d{8}$/.test(tail)) national = "0" + tail;
    } else if (cleaned.startsWith("966")) {
      const tail = cleaned.slice(3);
      if (/^5\d{8}$/.test(tail)) national = "0" + tail;
    } else if (cleaned.startsWith("+")) {
      // wrong country prefix
    } else if (/^05\d{8}$/.test(cleaned)) {
      national = cleaned;
    } else if (/^5\d{8}$/.test(cleaned)) {
      national = "0" + cleaned;
    }
    if (!national) {
      return {
        ok: false,
        canonical: raw,
        reason: "Saudi mobile number expected — 05 followed by 8 digits, or +966 5 and 8 digits.",
      };
    }
    return { ok: true, canonical: formatSA(national) };
  }

  // Unknown market — accept anything 8+ digits as a last resort.
  if (/^\+?\d{8,15}$/.test(cleaned)) {
    return { ok: true, canonical: cleaned };
  }
  return { ok: false, canonical: raw, reason: "unrecognized format" };
}

/** Normalize without strict validation. Useful at storage time when we want
 *  the cleanest form even if validation returned ok=false. */
export function normalizePhone(raw: string, market?: PhoneMarket): string {
  if (!raw) return raw;
  if (!market) return raw.trim();
  const r = validatePhone(raw, market);
  return r.ok ? r.canonical : raw.trim();
}
