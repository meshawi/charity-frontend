import { cn } from "@/lib/utils"
import { formatGregorian, formatHijri, formatTime } from "@/lib/date-utils"

/**
 * Compact two-line date for table cells: Hijri on top, Gregorian below.
 */
export function DualDate({
  value,
  withTime = false,
  withYear = true,
  className,
}: {
  value: string | null | undefined
  withTime?: boolean
  withYear?: boolean
  className?: string
}) {
  const gregorian = formatGregorian(value, { withYear })
  if (!gregorian) return <>—</>

  const hijri = formatHijri(value, { withYear })
  const time = withTime ? formatTime(value) : ""

  return (
    <div className={cn("flex flex-col leading-tight", className)}>
      <span className="whitespace-nowrap">{hijri || gregorian}</span>
      <span className="text-xs whitespace-nowrap text-muted-foreground">
        {hijri ? gregorian : null}
        {hijri && time ? " - " : null}
        {time}
      </span>
    </div>
  )
}
