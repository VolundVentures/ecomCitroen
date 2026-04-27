// Standard email validation. Strict-enough regex (RFC-pragmatic, not RFC-strict)
// matching everyday addresses. Returns the trimmed-lowered canonical form
// when valid; the original input + reason when not.

export type EmailValidation = {
  ok: boolean;
  canonical: string;
  reason?: string;
};

const RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function validateEmail(raw: string): EmailValidation {
  if (!raw || typeof raw !== "string") {
    return { ok: false, canonical: raw ?? "", reason: "missing" };
  }
  const trimmed = raw.trim();
  if (!RE.test(trimmed)) {
    return { ok: false, canonical: trimmed, reason: "format" };
  }
  return { ok: true, canonical: trimmed.toLowerCase() };
}
