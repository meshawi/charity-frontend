import * as React from "react"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ReligiousVisits } from "@/types/beneficiaries"
import { RELIGIOUS_KEYS, defaultReligiousItem } from "@/lib/beneficiary-constants"

export function ReligiousSection({
  data,
  onChange,
  disabled,
}: {
  data: ReligiousVisits
  onChange: React.Dispatch<React.SetStateAction<ReligiousVisits>>
  disabled: boolean
}) {
  function updateItem(key: keyof ReligiousVisits, field: string, value: unknown) {
    onChange((prev) => {
      const updated = { ...prev[key], [field]: value }
      if (field === "done" && !value) {
        delete updated.visitDate
      }
      return { ...prev, [key]: updated }
    })
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {RELIGIOUS_KEYS.map(({ key, label }) => {
          const item = data[key] ?? defaultReligiousItem()
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-3">
                <Switch
                  checked={item.done}
                  onCheckedChange={(checked) => updateItem(key, "done", checked)}
                  disabled={disabled}
                />
                <span className="text-sm">{label}</span>
              </div>
              {item.done && (
                <div className="flex flex-col gap-1 pr-11">
                  <Label className="text-xs">تاريخ الزيارة</Label>
                  <Input
                    type="date"
                    value={item.visitDate ?? ""}
                    onChange={(e) => updateItem(key, "visitDate", e.target.value || undefined)}
                    disabled={disabled}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
