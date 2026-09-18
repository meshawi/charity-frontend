import { HIJRI_MONTHS, toHijri } from "@/lib/hijri"

const AR_MONTHS: Record<number, string> = {
  0: "يناير",
  1: "فبراير",
  2: "مارس",
  3: "أبريل",
  4: "مايو",
  5: "يونيو",
  6: "يوليو",
  7: "أغسطس",
  8: "سبتمبر",
  9: "أكتوبر",
  10: "نوفمبر",
  11: "ديسمبر",
}

type DateParts = {
  year: number
  /** 1-based */
  month: number
  day: number
  /** Only set for timestamps — date-only values have no time of day */
  time: Date | null
}

/**
 * Date-only values ("2026-03-22") are calendar dates and must not be shifted
 * by the timezone; timestamps are shown in the viewer's local time.
 */
function parse(dateStr: string | null | undefined): DateParts | null {
  if (!dateStr) return null
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (dateOnly) {
    return {
      year: Number(dateOnly[1]),
      month: Number(dateOnly[2]),
      day: Number(dateOnly[3]),
      time: null,
    }
  }
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    time: d,
  }
}

/** "3 شوال 1447 هـ" — empty string if the date can't be converted */
export function formatHijri(
  dateStr: string | null | undefined,
  { withYear = true }: { withYear?: boolean } = {}
): string {
  const p = parse(dateStr)
  const h = p && toHijri(p.year, p.month, p.day)
  if (!h) return ""
  const base = `${h.day} ${HIJRI_MONTHS[h.month - 1]}`
  return withYear ? `${base} ${h.year} هـ` : base
}

/** "22 مارس 2026 م" */
export function formatGregorian(
  dateStr: string | null | undefined,
  { withYear = true }: { withYear?: boolean } = {}
): string {
  const p = parse(dateStr)
  if (!p) return ""
  const base = `${p.day} ${AR_MONTHS[p.month - 1]}`
  return withYear ? `${base} ${p.year} م` : base
}

/** "03:45 م" — empty string for date-only values */
export function formatTime(dateStr: string | null | undefined): string {
  const d = parse(dateStr)?.time
  if (!d) return ""
  const hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, "0")
  const period = hours >= 12 ? "م" : "ص"
  const h12 = hours % 12 || 12
  return `${h12.toString().padStart(2, "0")}:${minutes} ${period}`
}

/** "3 شوال 1447 هـ — 22 مارس 2026 م" */
export function formatDate(dateStr: string | null | undefined): string {
  const gregorian = formatGregorian(dateStr)
  if (!gregorian) return "—"
  const hijri = formatHijri(dateStr)
  return hijri ? `${hijri} — ${gregorian}` : gregorian
}

/** "3 شوال 1447 هـ — 22 مارس 2026 م - 03:45 م" */
export function formatDateTime(dateStr: string | null | undefined): string {
  const date = formatDate(dateStr)
  const time = formatTime(dateStr)
  return time ? `${date} - ${time}` : date
}
