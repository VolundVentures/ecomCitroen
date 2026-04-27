// Service-appointment date validation per Stellantis APV spec:
//   - Date must be ≥ tomorrow (J+1)
//   - Date must be ≤ today + 30 days (J+30)
//   - Sundays excluded (Moroccan workshops are closed Sundays)
//   - Public holidays excluded (small list seeded for 2026; expand as needed)
//
// Inputs come from the chatbot as user-typed strings — we accept several
// common formats (DD/MM/YYYY, YYYY-MM-DD, "tomorrow", weekday names).

export type DateValidation = {
  ok: boolean;
  /** ISO date "YYYY-MM-DD" when valid. */
  canonical: string;
  reason?: string;
  /** Set when reason is "holiday" — name of the holiday for the message. */
  holidayName?: string;
};

// Moroccan public holidays — seeded for the demo window. Update yearly.
// Format: "YYYY-MM-DD" → label.
const MA_HOLIDAYS: Record<string, string> = {
  "2026-01-01": "Nouvel An",
  "2026-01-11": "Manifeste de l'Indépendance",
  "2026-05-01": "Fête du Travail",
  "2026-07-30": "Fête du Trône",
  "2026-08-14": "Allégeance de Oued Eddahab",
  "2026-08-20": "Révolution du Roi et du Peuple",
  "2026-08-21": "Fête de la Jeunesse",
  "2026-11-06": "Marche Verte",
  "2026-11-18": "Fête de l'Indépendance",
  // Religious holidays — dates approximate, update with confirmed Hijri calendar
  "2026-03-31": "Aïd al-Fitr (1er jour)",
  "2026-04-01": "Aïd al-Fitr (2ème jour)",
  "2026-06-07": "Aïd al-Adha (1er jour)",
  "2026-06-08": "Aïd al-Adha (2ème jour)",
  "2026-06-27": "1er Moharram",
  "2026-09-04": "Mawlid",
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Parse common user date formats into a Date (local time, midnight). */
function parseDate(raw: string): Date | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;

  // YYYY-MM-DD
  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  // DD/MM/YYYY  or  DD-MM-YYYY  or  DD.MM.YYYY
  const dmy = t.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  // DD/MM (assume current year, but if past → next year)
  const dm = t.match(/^(\d{1,2})[/\-.](\d{1,2})$/);
  if (dm) {
    const [, d, m] = dm;
    const now = new Date();
    let dt = new Date(now.getFullYear(), Number(m) - 1, Number(d));
    if (dt < now) dt = new Date(now.getFullYear() + 1, Number(m) - 1, Number(d));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

export function validateAppointmentDate(raw: string, today: Date = new Date()): DateValidation {
  if (!raw || typeof raw !== "string") {
    return { ok: false, canonical: raw ?? "", reason: "missing" };
  }
  const dt = parseDate(raw);
  if (!dt) return { ok: false, canonical: raw, reason: "unparseable" };

  // Strip time, compare at day granularity.
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const max = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);

  if (dt < tomorrow) return { ok: false, canonical: toIsoDate(dt), reason: "too-soon" };
  if (dt > max) return { ok: false, canonical: toIsoDate(dt), reason: "too-far" };
  if (dt.getDay() === 0) return { ok: false, canonical: toIsoDate(dt), reason: "sunday" };

  const iso = toIsoDate(dt);
  const holidayName = MA_HOLIDAYS[iso];
  if (holidayName) {
    return { ok: false, canonical: iso, reason: "holiday", holidayName };
  }
  return { ok: true, canonical: iso };
}

/** Same shape, used for the COMPLAINT flow's "service_date" field — accepts
 *  any past date within the last 180 days. No Sunday/holiday exclusion. */
export function validateServiceDate(raw: string, today: Date = new Date()): DateValidation {
  if (!raw || typeof raw !== "string") {
    return { ok: false, canonical: raw ?? "", reason: "missing" };
  }
  const dt = parseDate(raw);
  if (!dt) return { ok: false, canonical: raw, reason: "unparseable" };
  const min = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 180);
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (dt > todayMid) return { ok: false, canonical: toIsoDate(dt), reason: "future" };
  if (dt < min) return { ok: false, canonical: toIsoDate(dt), reason: "too-old" };
  return { ok: true, canonical: toIsoDate(dt) };
}
