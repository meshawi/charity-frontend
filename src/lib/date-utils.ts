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

/** "22 مارس 2026" */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** "22 مارس 2026 - 03:45 م" */
export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  const hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, "0")
  const period = hours >= 12 ? "م" : "ص"
  const h12 = hours % 12 || 12
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()} - ${h12.toString().padStart(2, "0")}:${minutes} ${period}`
}

/** "22 مارس" (short — no year) */
export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]}`
}
