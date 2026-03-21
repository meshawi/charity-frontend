import * as React from "react"
import type {
  FilterField,
  FilterOperator,
  ActiveFilter,
} from "@/types/reports"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus, SlidersHorizontal } from "lucide-react"

const OPERATOR_LABELS: Record<string, string> = {
  eq: "مطابق",
  like: "يحتوي",
  in: "أحد",
  gte: "≥",
  lte: "≤",
  gt: ">",
  lt: "<",
}

const OPERATOR_LABELS_DATE: Record<string, string> = {
  eq: "=",
  gte: "من",
  lte: "إلى",
}

type FilterRow = {
  id: number
  field: string
  op: FilterOperator
  value: string | number | boolean | (string | number)[]
}

let nextId = 1

export function FilterBuilder({
  fields,
  onChange,
}: {
  fields: FilterField[]
  onChange: (filters: ActiveFilter[]) => void
}) {
  const [rows, setRows] = React.useState<FilterRow[]>([])
  const [open, setOpen] = React.useState(false)

  const fieldsByKey = React.useMemo(() => {
    const map: Record<string, FilterField> = {}
    for (const f of fields) map[f.key] = f
    return map
  }, [fields])

  const groups = React.useMemo(() => {
    const map: Record<string, FilterField[]> = {}
    for (const f of fields) {
      if (!map[f.group]) map[f.group] = []
      map[f.group].push(f)
    }
    return map
  }, [fields])

  // Emit onChange whenever rows change
  const prevRef = React.useRef("")
  React.useEffect(() => {
    const filters: ActiveFilter[] = rows
      .filter((r) => r.field && r.value !== "" && r.value !== undefined)
      .map((r) => ({ field: r.field, op: r.op, value: r.value }))
    const key = JSON.stringify(filters)
    if (key !== prevRef.current) {
      prevRef.current = key
      onChange(filters)
    }
  }, [rows, onChange])

  function addRow() {
    const firstField = fields[0]
    if (!firstField) return
    setRows((prev) => [
      ...prev,
      {
        id: nextId++,
        field: firstField.key,
        op: firstField.operators[0],
        value: getDefaultValue(firstField, firstField.operators[0]),
      },
    ])
    setOpen(true)
  }

  function removeRow(id: number) {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id)
      if (next.length === 0) setOpen(false)
      return next
    })
  }

  function clearAll() {
    setRows([])
    setOpen(false)
  }

  function updateField(id: number, fieldKey: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const f = fieldsByKey[fieldKey]
        if (!f) return r
        return {
          ...r,
          field: fieldKey,
          op: f.operators[0],
          value: getDefaultValue(f, f.operators[0]),
        }
      })
    )
  }

  function updateOp(id: number, op: FilterOperator) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const f = fieldsByKey[r.field]
        if (!f) return { ...r, op }
        // If switching to/from "in", reset value
        if (op === "in" && !Array.isArray(r.value)) {
          return { ...r, op, value: [] }
        }
        if (op !== "in" && Array.isArray(r.value)) {
          return { ...r, op, value: "" }
        }
        return { ...r, op }
      })
    )
  }

  function updateValue(
    id: number,
    value: string | number | boolean | (string | number)[]
  ) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, value } : r))
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => (rows.length > 0 ? setOpen(!open) : addRow())}
        >
          <SlidersHorizontal className="size-4" />
          فلترة
          {rows.length > 0 && (
            <Badge variant="secondary" className="ms-1 px-1.5 py-0 text-xs">
              {rows.length}
            </Badge>
          )}
        </Button>
        {rows.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            مسح الكل
          </Button>
        )}
      </div>

      {open && (
        <div className="rounded-lg border bg-card p-3">
          <div className="space-y-2">
            {rows.map((row) => {
              const field = fieldsByKey[row.field]
              return (
                <div key={row.id} className="flex items-end gap-2">
                  {/* Field select */}
                  <div className="flex w-40 shrink-0 flex-col gap-1">
                    {rows[0]?.id === row.id && (
                      <Label className="text-xs text-muted-foreground">
                        الحقل
                      </Label>
                    )}
                    <Select
                      value={row.field}
                      onValueChange={(v) => updateField(row.id, v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(groups).map(([group, gFields]) => (
                          <React.Fragment key={group}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              {group}
                            </div>
                            {gFields.map((f) => (
                              <SelectItem key={f.key} value={f.key}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </React.Fragment>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Operator select */}
                  <div className="flex w-24 shrink-0 flex-col gap-1">
                    {rows[0]?.id === row.id && (
                      <Label className="text-xs text-muted-foreground">
                        المعامل
                      </Label>
                    )}
                    <Select
                      value={row.op}
                      onValueChange={(v) =>
                        updateOp(row.id, v as FilterOperator)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {field?.operators.map((op) => (
                          <SelectItem key={op} value={op}>
                            {field.type === "date"
                              ? (OPERATOR_LABELS_DATE[op] ?? OPERATOR_LABELS[op])
                              : OPERATOR_LABELS[op]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value input */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {rows[0]?.id === row.id && (
                      <Label className="text-xs text-muted-foreground">
                        القيمة
                      </Label>
                    )}
                    <FilterValueInput
                      field={field}
                      op={row.op}
                      value={row.value}
                      onChange={(v) => updateValue(row.id, v)}
                    />
                  </div>

                  {/* Remove */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeRow(row.id)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={addRow}
          >
            <Plus className="size-4" />
            إضافة فلتر
          </Button>
        </div>
      )}
    </div>
  )
}

function getDefaultValue(
  field: FilterField,
  op: FilterOperator
): string | number | boolean | (string | number)[] {
  if (op === "in") return []
  if (field.type === "boolean") return true
  if (field.type === "number") return ""
  return ""
}

function FilterValueInput({
  field,
  op,
  value,
  onChange,
}: {
  field?: FilterField
  op: FilterOperator
  value: string | number | boolean | (string | number)[]
  onChange: (v: string | number | boolean | (string | number)[]) => void
}) {
  if (!field) return <Input disabled />

  // Boolean → radio
  if (field.type === "boolean") {
    return (
      <div className="flex h-8 items-center gap-4">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="radio"
            name={`bool-${field.key}`}
            checked={value === true}
            onChange={() => onChange(true)}
          />
          نعم
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="radio"
            name={`bool-${field.key}`}
            checked={value === false}
            onChange={() => onChange(false)}
          />
          لا
        </label>
      </div>
    )
  }

  // Enum / category with "in" operator → multi-select chips
  if ((field.type === "enum" || field.type === "category" || field.type === "program") && op === "in") {
    const selected = Array.isArray(value) ? value : []
    return (
      <div className="flex flex-wrap items-center gap-1">
        {field.options?.map((opt) => {
          const isSelected = selected.includes(opt.value)
          return (
            <Badge
              key={String(opt.value)}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                if (isSelected) {
                  onChange(selected.filter((v) => v !== opt.value))
                } else {
                  onChange([...selected, opt.value])
                }
              }}
            >
              {opt.label}
            </Badge>
          )
        })}
      </div>
    )
  }

  // Enum / category / program with "eq" → single select
  if (field.type === "enum" || field.type === "category" || field.type === "program") {
    return (
      <Select
        value={String(value ?? "")}
        onValueChange={(v) => {
          const opt = field.options?.find((o) => String(o.value) === v)
          onChange(opt ? opt.value : v)
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="اختر" />
        </SelectTrigger>
        <SelectContent>
          {field.options?.map((opt) => (
            <SelectItem key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Date
  if (field.type === "date") {
    return (
      <Input
        type="date"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  // Number
  if (field.type === "number") {
    return (
      <Input
        type="number"
        value={String(value ?? "")}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
      />
    )
  }

  // Text (default)
  return (
    <Input
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
