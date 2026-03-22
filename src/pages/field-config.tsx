import * as React from "react"
import * as fieldConfigApi from "@/lib/field-config-api"
import type { FieldConfigItem } from "@/lib/field-config-api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoaderCircle, Save, ChevronDown } from "lucide-react"

export default function FieldConfigPage() {
  const [fields, setFields] = React.useState<FieldConfigItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(
    new Set()
  )

  React.useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await fieldConfigApi.getFieldConfig()
      setFields(res.configs)
    } catch {
      toast.error("حدث خطأ في تحميل إعدادات الحقول")
    } finally {
      setLoading(false)
    }
  }

  function toggleRequired(fieldName: string) {
    setFields((prev) =>
      prev.map((f) =>
        f.fieldName === fieldName ? { ...f, isRequired: !f.isRequired } : f
      )
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updates = fields.map((f) => ({
        id: f.id,
        isRequired: f.isRequired,
      }))
      const res = await fieldConfigApi.updateFieldConfigBulk(updates)
      setFields(res.configs)
      toast.success("تم حفظ الإعدادات بنجاح")
    } catch {
      toast.error("حدث خطأ في حفظ الإعدادات")
    } finally {
      setSaving(false)
    }
  }

  // Group fields by fieldGroup
  const groups = React.useMemo(() => {
    const map: Record<string, FieldConfigItem[]> = {}
    for (const f of fields) {
      if (!map[f.fieldGroup]) map[f.fieldGroup] = []
      map[f.fieldGroup].push(f)
    }
    return map
  }, [fields])

  const GROUP_LABELS: Record<string, string> = {
    beneficiary: "المستفيد",
    dependent: "التابع",
    housing: "السكن",
    income: "الدخل",
    financial: "المالية",
    religious: "الدينية",
    furniture: "الأثاث",
  }

  function getGroupLabel(group: string) {
    return GROUP_LABELS[group.toLowerCase()] || group
  }

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-medium">إعدادات الحقول</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" disabled={saving} onClick={handleSave}>
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            حفظ
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groups).map(([group, groupFields]) => (
          <div key={group} className="rounded-lg border">
            <button
              type="button"
              className="flex w-full items-center justify-between border-b bg-muted/50 px-4 py-2"
              onClick={() => toggleGroup(group)}
            >
              <h2 className="text-sm font-medium">{getGroupLabel(group)}</h2>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${collapsedGroups.has(group) ? "-rotate-90" : ""}`}
              />
            </button>
            {!collapsedGroups.has(group) && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الحقل</TableHead>
                    <TableHead className="w-24 text-center">مطلوب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupFields.map((f) => (
                    <TableRow key={f.fieldName}>
                      <TableCell>{f.fieldLabel}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={f.isRequired}
                          onCheckedChange={() => toggleRequired(f.fieldName)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}
