/**
 * Hijri (Umm al-Qura) <-> Gregorian conversion.
 *
 * Dates are always stored and sent to the API as Gregorian "YYYY-MM-DD".
 * Hijri is an input/display concern only, so conversion relies on the
 * Umm al-Qura calendar that ships with the browser (Intl) — no dependency.
 */

export type HijriDate = { year: number; month: number; day: number }

export const HIJRI_MONTHS = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
]

/** Umm al-Qura tables cover 1300–1600 AH; 1500 AH (2077 م) is plenty. */
export const HIJRI_MIN_YEAR = 1300
export const HIJRI_MAX_YEAR = 1500

const DAY_MS = 86_400_000
/** 1 Muharram 1 AH (civil epoch) in the proleptic Gregorian calendar */
const HIJRI_EPOCH_MS = Date.UTC(622, 6, 19)

const formatter = new Intl.DateTimeFormat(
  "en-u-ca-islamic-umalqura-nu-latn",
  { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" }
)

const isSupported =
  formatter.resolvedOptions().calendar === "islamic-umalqura"

function hijriFromUtcMs(ms: number): HijriDate | null {
  if (!isSupported || Number.isNaN(ms)) return null
  const parts = formatter.formatToParts(new Date(ms))
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value)
  const hijri = { year: get("year"), month: get("month"), day: get("day") }
  if (!hijri.year || !hijri.month || !hijri.day) return null
  return hijri
}

/** Convert a Gregorian calendar date (month is 1-based) to Hijri. */
export function toHijri(
  year: number,
  month: number,
  day: number
): HijriDate | null {
  // Date.UTC() maps years 0–99 to 1900–1999 (a half-typed year like "0002")
  if (year < 1000) return null
  const hijri = hijriFromUtcMs(Date.UTC(year, month - 1, day))
  if (!hijri) return null
  if (hijri.year < HIJRI_MIN_YEAR || hijri.year > HIJRI_MAX_YEAR) return null
  return hijri
}

/** "YYYY-MM-DD" (Gregorian) -> Hijri */
export function gregorianToHijri(iso: string): HijriDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  return toHijri(Number(match[1]), Number(match[2]), Number(match[3]))
}

/**
 * Hijri -> "YYYY-MM-DD" (Gregorian).
 * Returns null when the date does not exist (e.g. day 30 of a 29-day month).
 */
export function hijriToGregorian({ year, month, day }: HijriDate): string | null {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < HIJRI_MIN_YEAR ||
    year > HIJRI_MAX_YEAR ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 30
  ) {
    return null
  }

  // Arithmetic estimate, then settle on the exact Umm al-Qura day around it
  const estimate =
    HIJRI_EPOCH_MS +
    Math.round((year - 1) * 354.36667 + (month - 1) * 29.5306 + (day - 1)) *
      DAY_MS

  for (let offset = -5; offset <= 5; offset++) {
    const ms = estimate + offset * DAY_MS
    const h = hijriFromUtcMs(ms)
    if (h && h.year === year && h.month === month && h.day === day) {
      return new Date(ms).toISOString().slice(0, 10)
    }
  }
  return null
}

/** Number of days (29 or 30) in a Hijri month. */
export function hijriMonthLength(year: number, month: number): 29 | 30 {
  return hijriToGregorian({ year, month, day: 30 }) ? 30 : 29
}
