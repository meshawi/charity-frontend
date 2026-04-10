import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import * as beneficiariesApi from "@/lib/beneficiaries-api"
import * as dependentsApi from "@/lib/dependents-api"
import * as categoriesApi from "@/lib/categories-api"
import { getAcknowledgmentUrl } from "@/lib/disbursements-api"
import type {
  Beneficiary,
  BeneficiaryDisbursement,
  Dependent,
  DocumentType,
  FurnitureAppliances,
  ProgressResponse,
  SubmitReviewErrorDetails,
} from "@/types/beneficiaries"
import type { Category } from "@/types/categories"
import { GENDER_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants"
import { formatDate } from "@/lib/date-utils"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  LoaderCircle,
  ArrowRight,
  Save,
  Plus,
  Pencil,
  Trash2,
  History,
  Tag,
  Send,
  AlertTriangle,
  Upload,
  Download,
  Eye,
} from "lucide-react"

import { Field } from "@/components/beneficiary/field"
import { ReligiousSection } from "@/components/beneficiary/religious-section"
import { AssignCategoryDialog } from "@/components/beneficiary/assign-category-dialog"
import { CategoryHistoryDialog } from "@/components/beneficiary/category-history-dialog"
import { DependentFormSection } from "@/components/beneficiary/dependent-form-section"
import { UploadDocumentDialog } from "@/components/beneficiary/upload-document-dialog"
import * as fieldConfigApi from "@/lib/field-config-api"
import type { FieldConfigItem } from "@/lib/field-config-api"
import {
  MARITAL_LABELS,
  RELATIONSHIP_LABELS,
  RESIDENCE_AREA_LABELS,
  BUILDING_OWNERSHIP_LABELS,
  BUILDING_TYPE_LABELS,
  BUILDING_CONDITION_LABELS,
  BUILDING_CAPACITY_LABELS,
  APPLIANCE_KEYS,
  CONDITION_KEYS,
  INCOME_KEYS,
  OBLIGATION_KEYS,
  calculateAge,
  initFurniture,
  initIncome,
  initObligations,
  initReligious,
} from "@/lib/beneficiary-constants"

// ===========================================================================

export default function BeneficiaryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const auth = useAuth()
  const [beneficiary, setBeneficiary] = React.useState<Beneficiary | null>(null)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const [createDepOpen, setCreateDepOpen] = React.useState(false)
  const [editDep, setEditDep] = React.useState<Dependent | null>(null)
  const [deleteDep, setDeleteDep] = React.useState<Dependent | null>(null)

  const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"info" | "dependents" | "documents">("info")

  const [progress, setProgress] = React.useState<ProgressResponse | null>(null)
  const [submittingReview, setSubmittingReview] = React.useState(false)
  const [missingFields, setMissingFields] = React.useState<SubmitReviewErrorDetails | null>(null)

  // Documents
  const [documentTypes, setDocumentTypes] = React.useState<DocumentType[]>([])
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [previewDoc, setPreviewDoc] = React.useState<{ name: string; url: string } | null>(null)

  const canEdit = auth.hasPermission("edit_profile")
  const canAssignCategory = auth.hasPermission("assign_category")

  // Custom fields
  const [customFieldConfigs, setCustomFieldConfigs] = React.useState<FieldConfigItem[]>([])
  const [depCustomFieldConfigs, setDepCustomFieldConfigs] = React.useState<FieldConfigItem[]>([])
  const [customFields, setCustomFields] = React.useState<Record<string, unknown>>({})

  // --- Form state ---
  const [form, setForm] = React.useState({
    name: "",
    nationalId: "",
    gender: "",
    dateOfBirth: "",
    maritalStatus: "",
    phone: "",
    otherPhone: "",
    otherPhoneRelationship: "",
    familyCount: "",
    dependentsCount: "",
    iban: "",
    bank: "",
    residenceArea: "",
    residenceAreaOther: "",
    buildingOwnership: "",
    buildingType: "",
    buildingTypeOther: "",
    buildingCondition: "",
    buildingCapacity: "",
    researcherName: "",
    firstVisitDate: "",
    updateDate: "",
    nextUpdate: "",
    healthCondition: "",
    healthStatus: "",
    origin: "",
    familySkillsTalents: "",
    researcherNotes: "",
  })

  const [husbandReligious, setHusbandReligious] = React.useState<Record<string, { done: boolean; visitDate?: string }>>({})
  const [furniture, setFurniture] = React.useState<FurnitureAppliances>({})
  const [income, setIncome] = React.useState<Record<string, { monthly: number; notes: string }>>({})
  const [obligations, setObligations] = React.useState<Record<string, { monthly: number; notes: string }>>({})
  const [rentDeduction, setRentDeduction] = React.useState(0)

  const loadData = React.useCallback(async () => {
    if (!id) return
    try {
      const [bRes, cRes] = await Promise.all([
        beneficiariesApi.getBeneficiary(Number(id)),
        categoriesApi.getCategories(),
      ])
      setBeneficiary(bRes.beneficiary)
      setCategories(cRes.categories)
      const b = bRes.beneficiary

      const [progressRes, docTypesRes, cfgRes, depCfgRes] = await Promise.all([
        beneficiariesApi.getProgress(Number(id)).catch(() => null),
        beneficiariesApi.getDocumentTypes(Number(id)).catch(() => null),
        fieldConfigApi.getFieldConfig("beneficiary").catch(() => null),
        fieldConfigApi.getFieldConfig("dependent").catch(() => null),
      ])
      if (progressRes) setProgress(progressRes)
      if (docTypesRes) setDocumentTypes(docTypesRes.types)
      if (cfgRes) {
        const active = cfgRes.configs.filter((c) => c.isCustom && c.isActive)
        setCustomFieldConfigs(active)
      }
      if (depCfgRes) {
        const active = depCfgRes.configs.filter((c) => c.isCustom && c.isActive)
        setDepCustomFieldConfigs(active)
      }
      setCustomFields(b.customFields ?? {})

      setForm({
        name: b.name || "",
        nationalId: b.nationalId,
        gender: b.gender || "",
        dateOfBirth: b.dateOfBirth || "",
        maritalStatus: b.maritalStatus || "",
        phone: b.phone || "",
        otherPhone: b.otherPhone || "",
        otherPhoneRelationship: b.otherPhoneRelationship || "",
        familyCount: b.familyCount != null ? String(b.familyCount) : "",
        dependentsCount: b.dependentsCount != null ? String(b.dependentsCount) : "",
        iban: b.iban || "",
        bank: b.bank || "",
        residenceArea: b.residenceArea || "",
        residenceAreaOther: b.residenceAreaOther || "",
        buildingOwnership: b.buildingOwnership || "",
        buildingType: b.buildingType || "",
        buildingTypeOther: b.buildingTypeOther || "",
        buildingCondition: b.buildingCondition || "",
        buildingCapacity: b.buildingCapacity || "",
        researcherName: b.researcherName || "",
        firstVisitDate: b.firstVisitDate ? b.firstVisitDate.split("T")[0] : "",
        updateDate: b.updateDate ? b.updateDate.split("T")[0] : "",
        nextUpdate: b.nextUpdate ? b.nextUpdate.split("T")[0] : "",
        healthCondition: b.healthCondition || "",
        healthStatus: b.healthStatus || "",
        origin: b.origin || "",
        familySkillsTalents: b.familySkillsTalents || "",
        researcherNotes: b.researcherNotes || "",
      })
      setHusbandReligious(initReligious(b.husbandReligious))
      setFurniture(initFurniture(b.furnitureAppliances))
      setIncome(initIncome(b.incomeSources))
      setObligations(initObligations(b.financialObligations))
      setRentDeduction(b.rentDeduction ?? 0)
    } catch {
      toast.error("حدث خطأ في تحميل بيانات المستفيد")
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!beneficiary) return
    setSaving(true)
    try {
      const numOrNull = (v: string) => (v !== "" ? Number(v) : null)
      const strOrNull = (v: string) => (v !== "" ? v : null)
      await beneficiariesApi.updateBeneficiary(beneficiary.id, {
        name: strOrNull(form.name),
        nationalId: form.nationalId,
        gender: (form.gender as "male" | "female") || null,
        dateOfBirth: strOrNull(form.dateOfBirth),
        maritalStatus: strOrNull(form.maritalStatus),
        phone: strOrNull(form.phone),
        otherPhone: strOrNull(form.otherPhone),
        otherPhoneRelationship: strOrNull(form.otherPhoneRelationship),
        familyCount: numOrNull(form.familyCount),
        iban: strOrNull(form.iban),
        bank: strOrNull(form.bank),
        residenceArea: strOrNull(form.residenceArea),
        residenceAreaOther: strOrNull(form.residenceAreaOther),
        buildingOwnership: strOrNull(form.buildingOwnership),
        buildingType: strOrNull(form.buildingType),
        buildingTypeOther: strOrNull(form.buildingTypeOther),
        buildingCondition: strOrNull(form.buildingCondition),
        buildingCapacity: strOrNull(form.buildingCapacity),
        husbandReligious: husbandReligious,
        furnitureAppliances: furniture,
        incomeSources: income,
        financialObligations: obligations,
        rentDeduction: rentDeduction,
        researcherName: strOrNull(form.researcherName),
        firstVisitDate: strOrNull(form.firstVisitDate),
        updateDate: strOrNull(form.updateDate),
        nextUpdate: strOrNull(form.nextUpdate),
        healthCondition: (form.healthCondition as "healthy" | "unhealthy") || null,
        healthStatus: form.healthCondition === "unhealthy" ? strOrNull(form.healthStatus) : null,
        origin: strOrNull(form.origin),
        familySkillsTalents: strOrNull(form.familySkillsTalents),
        researcherNotes: strOrNull(form.researcherNotes),
        customFields: customFields,
      })
      toast.success("تم حفظ البيانات بنجاح")
      loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ غير متوقع")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteDep() {
    if (!deleteDep || !beneficiary) return
    try {
      await dependentsApi.deleteDependent(beneficiary.id, deleteDep.id)
      toast.success("تم حذف التابع بنجاح")
      setDeleteDep(null)
      loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ غير متوقع")
    }
  }

  async function handleSubmitReview() {
    if (!beneficiary) return
    setSubmittingReview(true)
    setMissingFields(null)
    try {
      await beneficiariesApi.submitReview(beneficiary.id)
      toast.success("تم تقديم الملف للمراجعة")
      loadData()
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.details) {
        setMissingFields(err.details as unknown as SubmitReviewErrorDetails)
        toast.error("الحقول المطلوبة غير مكتملة")
      } else {
        toast.error(err instanceof ApiError ? err.message : "حدث خطأ غير متوقع")
      }
    } finally {
      setSubmittingReview(false)
    }
  }

  // --- Computed income totals ---
  const totalMonthlyIncome = INCOME_KEYS.reduce(
    (sum, { key }) => sum + (income[key]?.monthly ?? 0),
    0
  )
  const netIncome = totalMonthlyIncome - rentDeduction
  const familyCountNum = form.familyCount ? Number(form.familyCount) : 0
  const perCapita = familyCountNum > 0 ? Math.round(netIncome / familyCountNum) : 0

  const totalMonthlyObligations = OBLIGATION_KEYS.reduce(
    (sum, { key }) => sum + (obligations[key]?.monthly ?? 0),
    0
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!beneficiary) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        المستفيد غير موجود
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate("/beneficiaries")}
          >
            <ArrowRight className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-medium">
              {beneficiary.name || "مستفيد"}
            </h1>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {beneficiary.beneficiaryNumber}
            </p>
          </div>
          {beneficiary.category && (
            <Badge
              variant="outline"
              style={{
                borderColor: beneficiary.category.color,
                color: beneficiary.category.color,
              }}
            >
              {beneficiary.category.name}
            </Badge>
          )}
          <Badge className={STATUS_COLORS[beneficiary.status]}>
            {STATUS_LABELS[beneficiary.status]}
          </Badge>
          {beneficiary.age != null && (
            <span className="text-sm text-muted-foreground">
              العمر: {beneficiary.age} سنة
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View report in new tab */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/beneficiaries/${id}/view`, "_blank")}
          >
            <Eye className="size-4" />
            عرض بشكل تقرير
          </Button>
          {canEdit && (beneficiary.status === "draft" || beneficiary.status === "returned") && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSubmitReview}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              تقديم للمراجعة
            </Button>
          )}
          {canAssignCategory && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCategoryDialogOpen(true)}
            >
              <Tag className="size-4" />
              تعيين الفئة
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryDialogOpen(true)}
          >
            <History className="size-4" />
            سجل الفئة
          </Button>
          {canEdit && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              حفظ التعديلات
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="mb-4 rounded-lg border p-3">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">اكتمال الملف</span>
            <span className="font-medium">{progress.progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          {progress.pendingFields.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {progress.pendingFields.map((f) => (
                <Badge key={f.fieldName} variant="outline" className="text-xs text-destructive border-destructive/30">
                  {f.fieldLabel}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Return Note */}
      {beneficiary.status === "returned" && beneficiary.returnNote && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">ملاحظة الإرجاع</p>
            <p className="mt-1 text-sm">{beneficiary.returnNote}</p>
          </div>
        </div>
      )}

      {/* Missing Fields from submit review */}
      {missingFields && (
        <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-950">
          <p className="mb-2 text-sm font-medium text-yellow-700 dark:text-yellow-300">
            الحقول المطلوبة غير مكتملة:
          </p>
          {missingFields.beneficiaryMissing?.length > 0 && (
            <div className="mb-1">
              <span className="text-xs font-medium">المستفيد: </span>
              {missingFields.beneficiaryMissing.map((f) => (
                <Badge key={f.fieldName} variant="outline" className="me-1 text-xs">
                  {f.fieldLabel}
                </Badge>
              ))}
            </div>
          )}
          {missingFields.dependentMissing?.length > 0 && (
            <div>
              <span className="text-xs font-medium">التابعين: </span>
              {missingFields.dependentMissing.map((f, i) => (
                <Badge key={i} variant="outline" className="me-1 text-xs">
                  {f.dependentName}: {f.fieldLabel}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === Tab Bar === */}
      <div className="mb-6 flex gap-1 rounded-lg border bg-muted/30 p-1">
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${activeTab === "info" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("info")}
        >
          بيانات المستفيد
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${activeTab === "dependents" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("dependents")}
        >
          التابعين ({beneficiary.dependents.length})
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${activeTab === "documents" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("documents")}
        >
          المستندات ({beneficiary.documents?.length ?? 0})
        </button>
      </div>

      {activeTab === "info" && (<>

      {/* === Section 1: Basic Information === */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          المعلومات الأساسية
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="الاسم">
            <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="رقم الهوية">
            <Input dir="ltr" className="text-start" value={form.nationalId} onChange={(e) => updateField("nationalId", e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} disabled={!canEdit} />
          </Field>
          <Field label="الجنس">
            <Select value={form.gender} onValueChange={(v) => updateField("gender", v)} disabled={!canEdit}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">ذكر</SelectItem>
                <SelectItem value="female">أنثى</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="تاريخ الميلاد">
            <Input type="date" value={form.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} disabled={!canEdit} />
            {(beneficiary.age != null || calculateAge(form.dateOfBirth) != null) && (
              <span className="text-xs text-muted-foreground">
                العمر: {beneficiary.age ?? calculateAge(form.dateOfBirth)} سنة
              </span>
            )}
          </Field>
          <Field label="الحالة الاجتماعية">
            <Select value={form.maritalStatus} onValueChange={(v) => updateField("maritalStatus", v)} disabled={!canEdit}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {Object.entries(MARITAL_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="الهاتف">
            <Input dir="ltr" className="text-start" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="هاتف آخر">
            <Input dir="ltr" className="text-start" value={form.otherPhone} onChange={(e) => updateField("otherPhone", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="صلة صاحب الجوال الآخر">
            <Input value={form.otherPhoneRelationship} onChange={(e) => updateField("otherPhoneRelationship", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="عدد أفراد الأسرة">
            <Input type="number" value={form.familyCount} onChange={(e) => updateField("familyCount", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="عدد التابعين">
            <Input type="number" value={form.dependentsCount} onChange={(e) => updateField("dependentsCount", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="الأصل / المنطقة">
            <Input value={form.origin} onChange={(e) => updateField("origin", e.target.value)} disabled={!canEdit} />
          </Field>
        </div>
      </section>

      <Separator />

      {/* === Section 2: Residence & Building === */}
      <section className="my-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          السكن والبناء
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="جهة السكن بالطرف">
            <Select value={form.residenceArea} onValueChange={(v) => updateField("residenceArea", v)} disabled={!canEdit}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {Object.entries(RESIDENCE_AREA_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {form.residenceArea === "other" && (
            <Field label="جهة السكن (أخرى)">
              <Input value={form.residenceAreaOther} onChange={(e) => updateField("residenceAreaOther", e.target.value)} disabled={!canEdit} />
            </Field>
          )}
          <Field label="ملكية البناء">
            <Select value={form.buildingOwnership} onValueChange={(v) => updateField("buildingOwnership", v)} disabled={!canEdit}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {Object.entries(BUILDING_OWNERSHIP_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="نوع البناء">
            <Select value={form.buildingType} onValueChange={(v) => updateField("buildingType", v)} disabled={!canEdit}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {Object.entries(BUILDING_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {form.buildingType === "other" && (
            <Field label="نوع البناء (أخرى)">
              <Input value={form.buildingTypeOther} onChange={(e) => updateField("buildingTypeOther", e.target.value)} disabled={!canEdit} />
            </Field>
          )}
          <Field label="حالة البناء">
            <Select value={form.buildingCondition} onValueChange={(v) => updateField("buildingCondition", v)} disabled={!canEdit}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {Object.entries(BUILDING_CONDITION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="اتساع البناء">
            <Select value={form.buildingCapacity} onValueChange={(v) => updateField("buildingCapacity", v)} disabled={!canEdit}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {Object.entries(BUILDING_CAPACITY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <Separator />

      {/* === Section 3: Financial IBAN/Bank === */}
      <section className="my-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          المعلومات المالية
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="IBAN">
            <Input dir="ltr" className="text-start" value={form.iban} onChange={(e) => updateField("iban", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="البنك">
            <Input value={form.bank} onChange={(e) => updateField("bank", e.target.value)} disabled={!canEdit} />
          </Field>
        </div>
      </section>

      {/* === Income Sources Table === */}
      <section className="my-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          مصادر الدخل
        </h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-32">المصدر</TableHead>
                <TableHead className="min-w-24">شهري</TableHead>
                <TableHead className="min-w-32">ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INCOME_KEYS.map(({ key, label }) => (
                <TableRow key={key}>
                  <TableCell className="text-sm font-medium">{label}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-24"
                      value={income[key]?.monthly ?? 0}
                      onChange={(e) =>
                        setIncome((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], monthly: Number(e.target.value) || 0 },
                        }))
                      }
                      disabled={!canEdit}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-32"
                      value={income[key]?.notes ?? ""}
                      onChange={(e) =>
                        setIncome((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], notes: e.target.value },
                        }))
                      }
                      disabled={!canEdit}
                    />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-medium">
                <TableCell>المجموع</TableCell>
                <TableCell>{totalMonthlyIncome.toLocaleString("en")}</TableCell>
                <TableCell />
              </TableRow>
              <TableRow className="bg-muted/30 font-medium">
                <TableCell>خصم الإيجار</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="w-24"
                    value={rentDeduction}
                    onChange={(e) => setRentDeduction(Number(e.target.value) || 0)}
                    disabled={!canEdit}
                  />
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow className="bg-muted/30 font-medium">
                <TableCell>صافي الدخل</TableCell>
                <TableCell>{netIncome.toLocaleString("en")}</TableCell>
                <TableCell className="text-xs">
                  نصيب الفرد: {perCapita.toLocaleString("en")}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* === Financial Obligations Table === */}
      <section className="my-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          الالتزامات المالية
        </h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-32">الالتزام</TableHead>
                <TableHead className="min-w-24">شهري</TableHead>
                <TableHead className="min-w-32">ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {OBLIGATION_KEYS.map(({ key, label }) => (
                <TableRow key={key}>
                  <TableCell className="text-sm font-medium">{label}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-24"
                      value={obligations[key]?.monthly ?? 0}
                      onChange={(e) =>
                        setObligations((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], monthly: Number(e.target.value) || 0 },
                        }))
                      }
                      disabled={!canEdit}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-32"
                      value={obligations[key]?.notes ?? ""}
                      onChange={(e) =>
                        setObligations((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], notes: e.target.value },
                        }))
                      }
                      disabled={!canEdit}
                    />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-medium">
                <TableCell>المجموع</TableCell>
                <TableCell>{totalMonthlyObligations.toLocaleString("en")}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <Separator />

      {/* === Religious Visits === */}
      <section className="my-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          الزيارات الدينية
        </h2>
        <ReligiousSection
          data={husbandReligious}
          onChange={setHusbandReligious}
          disabled={!canEdit}
        />
      </section>

      <Separator />

      {/* === Furniture & Appliances Table === */}
      <section className="my-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          الأثاث والأجهزة والممتلكات
        </h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-28">العنصر</TableHead>
                {CONDITION_KEYS.map(({ key, label }) => (
                  <TableHead key={key} className="min-w-16 text-center">
                    {label}
                  </TableHead>
                ))}
                <TableHead className="min-w-28">ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {APPLIANCE_KEYS.map(({ key, label }) => (
                <TableRow key={key}>
                  <TableCell className="text-sm font-medium">{label}</TableCell>
                  {CONDITION_KEYS.map(({ key: ck }) => (
                    <TableCell key={ck}>
                      <Input
                        type="number"
                        className="w-16 text-center"
                        min={0}
                        value={furniture[key]?.[ck] ?? 0}
                        onChange={(e) =>
                          setFurniture((prev) => ({
                            ...prev,
                            [key]: {
                              ...prev[key],
                              [ck]: Number(e.target.value) || 0,
                            },
                          }))
                        }
                        disabled={!canEdit}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Input
                      className="w-28"
                      value={(furniture[key]?.notes as string) ?? ""}
                      onChange={(e) =>
                        setFurniture((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], notes: e.target.value },
                        }))
                      }
                      disabled={!canEdit}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Separator />

      {/* === Additional Info === */}
      <section className="my-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          معلومات إضافية
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="اسم الباحث">
            <Input value={form.researcherName} onChange={(e) => updateField("researcherName", e.target.value)} disabled={!canEdit} />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="تاريخ الزيارة الأولى">
            <Input type="date" value={form.firstVisitDate} onChange={(e) => updateField("firstVisitDate", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="تاريخ التحديث">
            <Input type="date" value={form.updateDate} onChange={(e) => updateField("updateDate", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="التحديث القادم">
            <Input type="date" value={form.nextUpdate} onChange={(e) => updateField("nextUpdate", e.target.value)} disabled={!canEdit} />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Switch
            checked={form.healthCondition === "unhealthy"}
            onCheckedChange={(checked) => {
              updateField("healthCondition", checked ? "unhealthy" : "healthy")
              if (!checked) updateField("healthStatus", "")
            }}
            disabled={!canEdit}
          />
          <Label>هل يعاني من مشاكل صحية؟</Label>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {form.healthCondition === "unhealthy" && (
            <Field label="تفاصيل الحالة الصحية">
              <Textarea value={form.healthStatus} onChange={(e) => updateField("healthStatus", e.target.value)} disabled={!canEdit} />
            </Field>
          )}
          <Field label="المهن والمواهب لأفراد العائلة">
            <Textarea value={form.familySkillsTalents} onChange={(e) => updateField("familySkillsTalents", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="ملاحظات وتوصيات الباحث">
            <Textarea value={form.researcherNotes} onChange={(e) => updateField("researcherNotes", e.target.value)} disabled={!canEdit} />
          </Field>
        </div>
      </section>

      {/* === Custom Fields === */}
      {customFieldConfigs.length > 0 && (
        <>
          <Separator />
          <section className="my-6">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              حقول مخصصة
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customFieldConfigs.map((cfg) => (
                <Field key={cfg.fieldName} label={cfg.fieldLabel}>
                  {cfg.fieldType === "text" && (
                    <Input
                      value={(customFields[cfg.fieldName] as string) ?? ""}
                      onChange={(e) =>
                        setCustomFields((prev) => ({ ...prev, [cfg.fieldName]: e.target.value }))
                      }
                      disabled={!canEdit}
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
                      disabled={!canEdit}
                    />
                  )}
                  {cfg.fieldType === "date" && (
                    <Input
                      type="date"
                      value={(customFields[cfg.fieldName] as string) ?? ""}
                      onChange={(e) =>
                        setCustomFields((prev) => ({ ...prev, [cfg.fieldName]: e.target.value }))
                      }
                      disabled={!canEdit}
                    />
                  )}
                  {cfg.fieldType === "select" && (
                    <Select
                      value={(customFields[cfg.fieldName] as string) ?? ""}
                      onValueChange={(v) =>
                        setCustomFields((prev) => ({ ...prev, [cfg.fieldName]: v }))
                      }
                      disabled={!canEdit}
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
                        disabled={!canEdit}
                      />
                    </div>
                  )}
                </Field>
              ))}
            </div>
          </section>
        </>
      )}

      </>)}

      {activeTab === "dependents" && (<>
      {/* === Dependents === */}
      <section className="my-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            التابعين ({beneficiary.dependents.length})
          </h2>
          {canEdit && !createDepOpen && !editDep && (
            <Button variant="outline" size="sm" onClick={() => setCreateDepOpen(true)}>
              <Plus className="size-4" />
              إضافة تابع
            </Button>
          )}
        </div>

        {/* Inline dependent form (create / edit) */}
        {(createDepOpen || editDep) && (
          <DependentFormSection
            key={editDep?.id ?? "new"}
            beneficiaryId={beneficiary.id}
            dependent={editDep}
            customFieldConfigs={depCustomFieldConfigs}
            onCancel={() => { setCreateDepOpen(false); setEditDep(null) }}
            onSuccess={() => { setCreateDepOpen(false); setEditDep(null); loadData() }}
          />
        )}

        {/* Dependent cards */}
        {beneficiary.dependents.length > 0 ? (
          <div className="space-y-2">
            {beneficiary.dependents.map((dep) => (
              <DependentCard
                key={dep.id}
                dep={dep}
                isEditing={editDep?.id === dep.id}
                canEdit={canEdit}
                onEdit={() => setEditDep(dep)}
                onDelete={() => setDeleteDep(dep)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">لا يوجد تابعين</p>
        )}
      </section>
      </>)}

      {activeTab === "documents" && (<>

      {/* === Documents === */}
      <section className="my-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            المستندات ({beneficiary.documents?.length ?? 0})
          </h2>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
              <Upload className="size-4" />
              رفع مستند
            </Button>
          )}
        </div>
        {beneficiary.documents?.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>اسم الملف</TableHead>
                  <TableHead>ملاحظات</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {beneficiary.documents.map((doc) => {
                  const docType = documentTypes.find((t) => t.key === doc.type)
                  const viewUrl = beneficiariesApi.getDocumentViewUrl(beneficiary.id, doc.id)
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {docType?.label || doc.type || "—"}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="text-primary underline text-start"
                          onClick={() => setPreviewDoc({ name: doc.name, url: viewUrl })}
                        >
                          {doc.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{doc.notes || "—"}</TableCell>
                      <TableCell>
                        {formatDate(doc.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setPreviewDoc({ name: doc.name, url: viewUrl })}
                            title="عرض"
                          >
                            <Eye className="size-4" />
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive"
                              onClick={async () => {
                                try {
                                  await beneficiariesApi.deleteDocument(beneficiary.id, doc.id)
                                  toast.success("تم حذف المستند")
                                  loadData()
                                } catch (err) {
                                  toast.error(err instanceof ApiError ? err.message : "حدث خطأ")
                                }
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">لا توجد مستندات</p>
        )}
      </section>

      <Separator />

      {/* === Disbursements === */}
      {beneficiary.disbursements?.length > 0 && (
        <section className="my-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            البرامج المستلمة ({beneficiary.disbursements.length})
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البرنامج</TableHead>
                  <TableHead>تاريخ الصرف</TableHead>
                  <TableHead>الموزع</TableHead>
                  <TableHead>المستلم</TableHead>
                  <TableHead>ملاحظات</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {beneficiary.disbursements.map((d: BeneficiaryDisbursement) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.program.name}</TableCell>
                    <TableCell>{formatDate(d.disbursedAt)}</TableCell>
                    <TableCell>{d.disbursedBy.name}</TableCell>
                    <TableCell>{d.receiverName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{d.notes || "—"}</TableCell>
                    <TableCell>
                      {d.acknowledgmentFile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(getAcknowledgmentUrl(d.id), "_blank")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      </>)}

      {/* Metadata */}
      <Separator />
      <div className="mt-6 flex gap-6 text-sm text-muted-foreground">
        <span>أنشئ بواسطة: {beneficiary.createdBy.name}</span>
        <span>
          تاريخ الإنشاء:{" "}
          {formatDate(beneficiary.createdAt)}
        </span>
      </div>

      {/* --- Dialogs --- */}

      <AlertDialog open={!!deleteDep} onOpenChange={(open) => !open && setDeleteDep(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التابع</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف التابع &quot;{deleteDep?.name}&quot; لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDep}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AssignCategoryDialog
        beneficiaryId={beneficiary.id}
        currentCategoryId={beneficiary.categoryId}
        categories={categories}
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSuccess={loadData}
      />

      <CategoryHistoryDialog
        beneficiaryId={beneficiary.id}
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
      />

      <UploadDocumentDialog
        beneficiaryId={beneficiary.id}
        documentTypes={documentTypes}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={loadData}
      />

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name}</DialogTitle>
          </DialogHeader>
          {previewDoc && (() => {
            const ext = (previewDoc.name || "").split(".").pop()?.toLowerCase() ?? ""
            const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)
            const isPdf = ext === "pdf"
            if (isImage) {
              return <img src={previewDoc.url} alt={previewDoc.name} className="max-h-[70vh] w-full object-contain" />
            }
            if (isPdf) {
              return <iframe src={previewDoc.url} title={previewDoc.name} className="h-[70vh] w-full border-0" />
            }
            return (
              <div className="flex flex-col items-center gap-3 py-8">
                <p className="text-sm text-muted-foreground">لا يمكن عرض هذا النوع من الملفات</p>
                <a href={previewDoc.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <Download className="size-4" />
                    تحميل الملف
                  </Button>
                </a>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Floating save button */}
      {canEdit && (
        <div className="fixed bottom-6 end-6 z-50 print:hidden">
          <Button onClick={handleSave} disabled={saving} size="sm" className="shadow-lg">
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            حفظ التعديلات
          </Button>
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// Dependent Card (expandable)
// ===========================================================================

function DependentCard({
  dep,
  isEditing,
  canEdit,
  onEdit,
  onDelete,
}: {
  dep: Dependent
  isEditing: boolean
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${isEditing ? "border-primary bg-primary/5" : canEdit ? "cursor-pointer hover:bg-muted/30" : ""}`}>
      <button
        type="button"
        className="flex flex-1 items-center gap-3 text-start"
        onClick={() => canEdit && onEdit()}
        disabled={!canEdit}
      >
        <span className="text-sm font-medium flex-1">{dep.name || "—"}</span>
        {dep.relationship && (
          <Badge variant="outline" className="text-xs">
            {dep.relationship === "other" ? dep.relationshipOther || "أخرى" : RELATIONSHIP_LABELS[dep.relationship]}
          </Badge>
        )}
        {dep.gender && (
          <Badge variant="secondary" className="text-xs">{GENDER_LABELS[dep.gender]}</Badge>
        )}
        {dep.age != null && (
          <span className="text-xs text-muted-foreground">{dep.age} سنة</span>
        )}
      </button>
      {canEdit && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            title="تعديل"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            onClick={onDelete}
            title="حذف"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
