import * as React from "react"
import * as dependentsApi from "@/lib/dependents-api"
import type { Dependent, DependentReligious } from "@/types/beneficiaries"
import type { FieldConfigItem } from "@/lib/field-config-api"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoaderCircle } from "lucide-react"
import {
  RELATIONSHIP_LABELS,
  EDUCATION_LABELS,
  SCHOOL_TYPE_LABELS,
  DEP_RELIGIOUS_KEYS,
  defaultDependentReligiousItem,
  initDependentReligious,
} from "@/lib/beneficiary-constants"

export function DependentFormSection({
  beneficiaryId,
  dependent,
  customFieldConfigs = [],
  onCancel,
  onSuccess,
}: {
  beneficiaryId: number
  dependent?: Dependent | null
  customFieldConfigs?: FieldConfigItem[]
  onCancel: () => void
  onSuccess: () => void
}) {
  const isEdit = !!dependent
  const [name, setName] = React.useState(dependent?.name || "")
  const [nationalId, setNationalId] = React.useState(dependent?.nationalId || "")
  const [gender, setGender] = React.useState(dependent?.gender || "")
  const [dateOfBirth, setDateOfBirth] = React.useState(dependent?.dateOfBirth?.split("T")[0] || "")
  const [relationship, setRelationship] = React.useState(dependent?.relationship || "")
  const [relationshipOther, setRelationshipOther] = React.useState(dependent?.relationshipOther || "")
  const [dependentMaritalStatus, setDependentMaritalStatus] = React.useState(dependent?.dependentMaritalStatus || "")
  const [schoolName, setSchoolName] = React.useState(dependent?.schoolName || "")
  const [schoolGrade, setSchoolGrade] = React.useState(dependent?.schoolGrade || "")
  const [schoolType, setSchoolType] = React.useState(dependent?.schoolType || "")
  const [schoolTypeOther, setSchoolTypeOther] = React.useState(dependent?.schoolTypeOther || "")
  const [academicGrade, setAcademicGrade] = React.useState(dependent?.academicGrade || "")
  const [weaknessSubjects, setWeaknessSubjects] = React.useState(dependent?.weaknessSubjects || "")
  const [educationStatus, setEducationStatus] = React.useState(dependent?.educationStatus || "")
  const [healthCondition, setHealthCondition] = React.useState(dependent?.healthCondition || "")
  const [healthStatus, setHealthStatus] = React.useState(dependent?.healthStatus || "")
  const [notes, setNotes] = React.useState(dependent?.notes || "")
  const [religious, setReligious] = React.useState<DependentReligious>(initDependentReligious(dependent?.religious ?? null))
  const [customFields, setCustomFields] = React.useState<Record<string, unknown>>(dependent?.customFields ?? {})
  const [submitting, setSubmitting] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data = {
        name: name || undefined,
        nationalId: nationalId || undefined,
        gender: (gender as "male" | "female") || undefined,
        dateOfBirth: dateOfBirth || undefined,
        relationship: (relationship as "son" | "daughter" | "other") || undefined,
        relationshipOther: relationship === "other" ? relationshipOther || undefined : undefined,
        dependentMaritalStatus: dependentMaritalStatus || undefined,
        schoolName: schoolName || undefined,
        schoolGrade: schoolGrade || undefined,
        schoolType: (schoolType as "public" | "private" | "other") || undefined,
        schoolTypeOther: schoolType === "other" ? schoolTypeOther || undefined : undefined,
        academicGrade: academicGrade || undefined,
        weaknessSubjects: weaknessSubjects || undefined,
        educationStatus:
          (educationStatus as "enrolled" | "graduated" | "dropped_out" | "not_enrolled") || undefined,
        healthCondition: (healthCondition as "healthy" | "unhealthy") || undefined,
        healthStatus: healthCondition === "unhealthy" ? healthStatus || undefined : undefined,
        religious: religious,
        notes: notes || undefined,
        customFields: customFields,
      }
      if (isEdit && dependent) {
        await dependentsApi.updateDependent(beneficiaryId, dependent.id, data)
        toast.success("تم تحديث التابع بنجاح")
      } else {
        await dependentsApi.createDependent(beneficiaryId, data)
        toast.success("تم إضافة التابع بنجاح")
      }
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ غير متوقع")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mb-6 rounded-lg border bg-muted/30 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {isEdit ? "تعديل التابع" : "إضافة تابع جديد"}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          إلغاء
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="dep-name">الاسم</Label>
            <Input id="dep-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dep-nid">رقم الهوية</Label>
            <Input id="dep-nid" dir="ltr" className="text-start" value={nationalId} onChange={(e) => setNationalId(e.target.value)} maxLength={10} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>الجنس</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">ذكر</SelectItem>
                <SelectItem value="female">أنثى</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dep-dob">تاريخ الميلاد</Label>
            <Input id="dep-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>صلة القرابة</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {relationship === "other" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dep-rel-other">صلة القرابة (أخرى)</Label>
              <Input id="dep-rel-other" value={relationshipOther} onChange={(e) => setRelationshipOther(e.target.value)} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dep-marital">الحالة الاجتماعية</Label>
            <Input id="dep-marital" value={dependentMaritalStatus} onChange={(e) => setDependentMaritalStatus(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>الحالة التعليمية</Label>
            <Select value={educationStatus} onValueChange={setEducationStatus}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {Object.entries(EDUCATION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dep-school">اسم المدرسة</Label>
            <Input id="dep-school" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dep-grade">الصف الدراسي</Label>
            <Input id="dep-grade" value={schoolGrade} onChange={(e) => setSchoolGrade(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>نوع المدرسة</Label>
            <Select value={schoolType} onValueChange={setSchoolType}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {Object.entries(SCHOOL_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {schoolType === "other" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dep-school-other">نوع المدرسة (أخرى)</Label>
              <Input id="dep-school-other" value={schoolTypeOther} onChange={(e) => setSchoolTypeOther(e.target.value)} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dep-academic">التقدير الدراسي</Label>
            <Input id="dep-academic" value={academicGrade} onChange={(e) => setAcademicGrade(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dep-weakness">مواد الضعف</Label>
            <Textarea id="dep-weakness" value={weaknessSubjects} onChange={(e) => setWeaknessSubjects(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dep-notes">ملاحظات</Label>
            <Textarea id="dep-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={healthCondition === "unhealthy"}
            onCheckedChange={(checked) => {
              setHealthCondition(checked ? "unhealthy" : "healthy")
              if (!checked) setHealthStatus("")
            }}
          />
          <Label>هل يعاني من مشاكل صحية؟</Label>
        </div>
        {healthCondition === "unhealthy" && (
          <div className="flex flex-col gap-1.5">
            <Label>تفاصيل الحالة الصحية</Label>
            <Textarea value={healthStatus} onChange={(e) => setHealthStatus(e.target.value)} />
          </div>
        )}

        {/* Dependent Religious Visits */}
        <div className="rounded-lg border p-3">
          <h4 className="mb-3 text-sm font-medium">الزيارات الدينية</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {DEP_RELIGIOUS_KEYS.map(({ key, label }) => {
              const item = religious[key] ?? defaultDependentReligiousItem()
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={item.done}
                      onCheckedChange={(checked) =>
                        setReligious((prev) => {
                          const updated = { ...prev[key], done: checked }
                          if (!checked) {
                            delete updated.visitDate
                          }
                          return { ...prev, [key]: updated }
                        })
                      }
                    />
                    <span className="text-sm">{label}</span>
                  </div>
                  {item.done && (
                    <div className="flex flex-col gap-1 pr-11">
                      <Label className="text-xs">تاريخ الزيارة</Label>
                      <Input
                        type="date"
                        value={item.visitDate ?? ""}
                        onChange={(e) =>
                          setReligious((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], visitDate: e.target.value || undefined },
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Custom Fields */}
        {customFieldConfigs.length > 0 && (
          <div className="rounded-lg border p-3">
            <h4 className="mb-3 text-sm font-medium">حقول مخصصة</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customFieldConfigs.map((cfg) => (
                <div key={cfg.fieldName} className="flex flex-col gap-1.5">
                  <Label>{cfg.fieldLabel}</Label>
                  {cfg.fieldType === "text" && (
                    <Input
                      value={(customFields[cfg.fieldName] as string) ?? ""}
                      onChange={(e) =>
                        setCustomFields((prev) => ({ ...prev, [cfg.fieldName]: e.target.value }))
                      }
                    />
                  )}
                  {cfg.fieldType === "number" && (
                    <Input
                      type="number"
                      value={(customFields[cfg.fieldName] as number) ?? ""}
                      onChange={(e) =>
                        setCustomFields((prev) => ({
                          ...prev,
                          [cfg.fieldName]: e.target.value ? Number(e.target.value) : "",
                        }))
                      }
                    />
                  )}
                  {cfg.fieldType === "date" && (
                    <Input
                      type="date"
                      value={(customFields[cfg.fieldName] as string) ?? ""}
                      onChange={(e) =>
                        setCustomFields((prev) => ({ ...prev, [cfg.fieldName]: e.target.value }))
                      }
                    />
                  )}
                  {cfg.fieldType === "select" && (
                    <Select
                      value={(customFields[cfg.fieldName] as string) ?? ""}
                      onValueChange={(v) =>
                        setCustomFields((prev) => ({ ...prev, [cfg.fieldName]: v }))
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>
                        {cfg.options?.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {cfg.fieldType === "boolean" && (
                    <div className="flex items-center pt-1">
                      <Switch
                        checked={!!customFields[cfg.fieldName]}
                        onCheckedChange={(v) =>
                          setCustomFields((prev) => ({ ...prev, [cfg.fieldName]: v }))
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting && <LoaderCircle className="animate-spin" />}
            {isEdit ? "حفظ" : "إضافة"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  )
}
