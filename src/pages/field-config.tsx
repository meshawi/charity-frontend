import * as React from "react"
import * as fieldConfigApi from "@/lib/field-config-api"
import type { FieldConfigItem, FieldType } from "@/lib/field-config-api"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { LoaderCircle, Save, ChevronDown, Plus, Trash2, Pencil } from "lucide-react"

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "نص",
  number: "رقم",
  date: "تاريخ",
  select: "قائمة اختيار",
  boolean: "نعم / لا",
}

export default function FieldConfigPage() {
  const [fields, setFields] = React.useState<FieldConfigItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [showInactive, setShowInactive] = React.useState(false)
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(
    new Set()
  )

  // Dialogs
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editField, setEditField] = React.useState<FieldConfigItem | null>(null)
  const [deleteField, setDeleteField] = React.useState<FieldConfigItem | null>(null)

  React.useEffect(() => {
    loadData()
  }, [showInactive])

  async function loadData() {
    try {
      const res = await fieldConfigApi.getFieldConfig(
        undefined,
        showInactive || undefined
      )
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

  async function handleDelete() {
    if (!deleteField) return
    try {
      await fieldConfigApi.deleteCustomField(deleteField.id)
      toast.success("تم تعطيل الحقل المخصص")
      setDeleteField(null)
      loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ")
    }
  }

  async function handleReactivate(field: FieldConfigItem) {
    try {
      await fieldConfigApi.updateFieldConfig(field.id, { isActive: true })
      toast.success("تم تفعيل الحقل")
      loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ")
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
          <div className="flex items-center gap-2 me-4">
            <Switch
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label className="text-xs">إظهار المعطلة</Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            إضافة حقل مخصص
          </Button>
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
                    <TableHead className="w-24">النوع</TableHead>
                    <TableHead className="w-24 text-center">مطلوب</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupFields.map((f) => (
                    <TableRow
                      key={f.fieldName}
                      className={!f.isActive ? "opacity-50" : undefined}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {f.fieldLabel}
                          {f.isCustom && (
                            <Badge variant="secondary" className="text-[10px]">
                              مخصص
                            </Badge>
                          )}
                          {!f.isActive && (
                            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                              معطل
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {f.isCustom ? FIELD_TYPE_LABELS[f.fieldType] : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={f.isRequired}
                          onCheckedChange={() => toggleRequired(f.fieldName)}
                          disabled={!f.isActive}
                        />
                      </TableCell>
                      <TableCell>
                        {f.isCustom && (
                          <div className="flex items-center gap-1">
                            {f.isActive ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => setEditField(f)}
                                  title="تعديل"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-destructive"
                                  onClick={() => setDeleteField(f)}
                                  title="تعطيل"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => handleReactivate(f)}
                              >
                                تفعيل
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ))}
      </div>

      {/* Create Custom Field Dialog */}
      <CustomFieldDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={loadData}
      />

      {/* Edit Custom Field Dialog */}
      <CustomFieldDialog
        field={editField}
        open={!!editField}
        onOpenChange={(open) => !open && setEditField(null)}
        onSuccess={loadData}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteField} onOpenChange={(open) => !open && setDeleteField(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تعطيل الحقل المخصص</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إخفاء الحقل &quot;{deleteField?.fieldLabel}&quot; من النموذج.
              البيانات المحفوظة لن تُحذف وسيمكن إعادة تفعيل الحقل لاحقاً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>تعطيل</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===========================================================================
// Create / Edit Custom Field Dialog
// ===========================================================================

function CustomFieldDialog({
  field,
  open,
  onOpenChange,
  onSuccess,
}: {
  field?: FieldConfigItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const isEdit = !!field
  const [fieldName, setFieldName] = React.useState("")
  const [fieldLabel, setFieldLabel] = React.useState("")
  const [fieldGroup, setFieldGroup] = React.useState<string>("beneficiary")
  const [fieldType, setFieldType] = React.useState<FieldType>("text")
  const [optionsText, setOptionsText] = React.useState("")
  const [isRequired, setIsRequired] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open && field) {
      setFieldName(field.fieldName)
      setFieldLabel(field.fieldLabel)
      setFieldGroup(field.fieldGroup)
      setFieldType(field.fieldType)
      setOptionsText(field.options?.join("\n") ?? "")
      setIsRequired(field.isRequired)
    } else if (open) {
      setFieldName("")
      setFieldLabel("")
      setFieldGroup("beneficiary")
      setFieldType("text")
      setOptionsText("")
      setIsRequired(false)
    }
  }, [open, field])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const options =
        fieldType === "select"
          ? optionsText
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined

      if (isEdit && field) {
        await fieldConfigApi.updateFieldConfig(field.id, {
          fieldLabel,
          fieldType,
          options,
          isRequired,
        })
        toast.success("تم تحديث الحقل بنجاح")
      } else {
        await fieldConfigApi.createCustomField({
          fieldName: fieldName.replace(/[^a-zA-Z0-9_]/g, ""),
          fieldLabel,
          fieldGroup,
          fieldType,
          options,
          isRequired,
        })
        toast.success("تم إضافة الحقل المخصص بنجاح")
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "تعديل الحقل المخصص" : "إضافة حقل مخصص"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label>اسم الحقل (بالإنجليزية)</Label>
              <Input
                dir="ltr"
                className="text-start"
                value={fieldName}
                onChange={(e) =>
                  setFieldName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
                }
                placeholder="e.g. bloodType"
                required
              />
              <p className="text-xs text-muted-foreground">
                أحرف إنجليزية وأرقام و _ فقط
              </p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>التسمية (بالعربية)</Label>
            <Input
              value={fieldLabel}
              onChange={(e) => setFieldLabel(e.target.value)}
              placeholder="مثال: فصيلة الدم"
              required
            />
          </div>
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label>المجموعة</Label>
              <Select value={fieldGroup} onValueChange={setFieldGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beneficiary">المستفيد</SelectItem>
                  <SelectItem value="dependent">التابع</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>نوع الحقل</Label>
            <Select
              value={fieldType}
              onValueChange={(v) => setFieldType(v as FieldType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIELD_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {fieldType === "select" && (
            <div className="flex flex-col gap-1.5">
              <Label>الخيارات (كل خيار في سطر)</Label>
              <textarea
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder={"O+\nO-\nA+\nA-"}
              />
            </div>
          )}
          <div className="flex items-center gap-3">
            <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            <Label>حقل مطلوب</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <LoaderCircle className="size-4 animate-spin" />}
              {isEdit ? "حفظ" : "إضافة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
