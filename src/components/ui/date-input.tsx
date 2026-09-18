import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  HIJRI_MONTHS,
  gregorianToHijri,
  hijriToGregorian,
} from "@/lib/hijri"

type HijriFields = { day: string; month: string; year: string }

const EMPTY_FIELDS: HijriFields = { day: "", month: "", year: "" }

function fieldsFromValue(value: string): HijriFields {
  const h = gregorianToHijri(value)
  if (!h) return EMPTY_FIELDS
  return { day: String(h.day), month: String(h.month), year: String(h.year) }
}

function isComplete(f: HijriFields) {
  return f.day !== "" && f.month !== "" && f.year.length === 4
}

function resolve(f: HijriFields): string | null {
  if (!isComplete(f)) return null
  return hijriToGregorian({
    day: Number(f.day),
    month: Number(f.month),
    year: Number(f.year),
  })
}

/** Keep digits only — Arabic-Indic digits (٠-٩) are accepted and normalized */
function toDigits(raw: string, maxLength: number) {
  return raw
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/\D/g, "")
    .slice(0, maxLength)
}

/** Entering a day/year segment selects it, so typing replaces the old value */
function selectOnFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.select()
}

/**
 * Date field that can be filled in either calendar. The Hijri (Umm al-Qura)
 * row and the Gregorian picker stay in sync; the value is always a Gregorian
 * "YYYY-MM-DD" string (or "" when empty), same as a native date input.
 */
function DateInput({
  id,
  value,
  onChange,
  disabled,
  className,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}) {
  const [fields, setFields] = React.useState(() => fieldsFromValue(value))
  const [syncedValue, setSyncedValue] = React.useState(value)

  // Value changed from outside the Hijri row (Gregorian picker, loaded record,
  // form reset). Half-typed Hijri fields resolve to "" and are left alone.
  if (value !== syncedValue) {
    setSyncedValue(value)
    if ((resolve(fields) ?? "") !== value) {
      setFields(fieldsFromValue(value))
    }
  }

  function updateFields(patch: Partial<HijriFields>) {
    const next = { ...fields, ...patch }
    setFields(next)
    const iso = resolve(next) ?? ""
    if (iso !== value) onChange(iso)
  }

  const invalid = isComplete(fields) && resolve(fields) === null

  return (
    <div data-slot="date-input" className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-1">
        <span className="w-4 shrink-0 text-center text-xs text-muted-foreground">
          هـ
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap gap-1">
          <Input
            aria-label="اليوم (هجري)"
            aria-invalid={invalid || undefined}
            inputMode="numeric"
            placeholder="يوم"
            className="w-11 px-1 text-center"
            value={fields.day}
            onFocus={selectOnFocus}
            onChange={(e) => {
              const day = toDigits(e.target.value, 2)
              if (Number(day) <= 30) updateFields({ day })
            }}
            disabled={disabled}
          />
          <Select
            value={fields.month}
            onValueChange={(month) => updateFields({ month })}
            disabled={disabled}
          >
            <SelectTrigger
              aria-label="الشهر (هجري)"
              aria-invalid={invalid || undefined}
              className="w-auto min-w-0 flex-1 basis-24"
            >
              <SelectValue placeholder="الشهر" />
            </SelectTrigger>
            <SelectContent>
              {HIJRI_MONTHS.map((name, i) => (
                <SelectItem key={name} value={String(i + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            aria-label="السنة (هجري)"
            aria-invalid={invalid || undefined}
            inputMode="numeric"
            placeholder="سنة"
            className="w-16 px-1 text-center"
            value={fields.year}
            onFocus={selectOnFocus}
            onChange={(e) => updateFields({ year: toDigits(e.target.value, 4) })}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-4 shrink-0 text-center text-xs text-muted-foreground">
          م
        </span>
        <Input
          id={id}
          type="date"
          aria-label="التاريخ الميلادي"
          className="min-w-0 flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      {invalid && (
        <span className="text-xs text-destructive">
          التاريخ الهجري غير صحيح
        </span>
      )}
    </div>
  )
}

export { DateInput }
