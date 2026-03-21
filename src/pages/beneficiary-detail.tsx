import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import * as beneficiariesApi from "@/lib/beneficiaries-api"
import * as dependentsApi from "@/lib/dependents-api"
import * as categoriesApi from "@/lib/categories-api"
import type {
  Beneficiary,
  BeneficiaryDisbursement,
  Dependent,
  CategoryHistoryEntry,
  ReligiousVisits,
  ReligiousItem,
  FurnitureAppliances,
  ApplianceCondition,
  IncomeSources,
  IncomeItem,
  FinancialObligations,
  ObligationItem,
} from "@/types/beneficiaries"
import type { Category } from "@/types/categories"
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
  DialogDescription,
  DialogFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LoaderCircle,
  ArrowRight,
  Save,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  History,
  Tag,
} from "lucide-react"

const GENDER_LABELS: Record<string, string> = {
  male: "ذكر",
  female: "أنثى",
}

const MARITAL_LABELS: Record<string, string> = {
  married: "متزوج / متزوجة",
  single: "أعزب / عزباء",
  divorced: "مطلقة",
  widowed: "أرملة",
  abandoned: "مهجورة",
}

const EDUCATION_LABELS: Record<string, string> = {
  enrolled: "ملتحق",
  graduated: "متخرج",
  dropped_out: "منقطع",
  not_enrolled: "غير ملتحق",
}

const SCHOOL_TYPE_LABELS: Record<string, string> = {
  public: "حكومية",
  private: "أهلية",
  other: "أخرى",
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  son: "ابن",
  daughter: "ابنة",
  other: "أخرى",
}

const RESIDENCE_AREA_LABELS: Record<string, string> = {
  aldeira: "الديرة",
  aladwa: "العدوة",
  alrashidia: "الراشدية",
  alabadia: "العبادية",
  alsaadoon: "السعدون",
  aliskan: "الإسكان",
  aldahia: "الضاحية",
  aldana: "الدانة",
  other: "أخرى",
}

const BUILDING_OWNERSHIP_LABELS: Record<string, string> = {
  private: "ملك خاص / إسكان",
  shared: "ملك مشترك",
  rented: "مستأجر",
}

const BUILDING_TYPE_LABELS: Record<string, string> = {
  arabic: "عربي",
  concrete: "مسلح",
  other: "غيره",
}

const BUILDING_CONDITION_LABELS: Record<string, string> = {
  good: "جيدة",
  average: "متوسطة",
  needs_repair: "بحاجة لإصلاح",
}

const BUILDING_CAPACITY_LABELS: Record<string, string> = {
  small: "صغير (لا يكفي الأسرة)",
  medium: "متوسط",
  sufficient: "يكفي الأسرة",
}

// --- Furniture/Appliances ---

const APPLIANCE_KEYS: { key: string; label: string }[] = [
  { key: "windowAC", label: "مكيفات نافذة" },
  { key: "splitAC", label: "مكيفات وحدة (سبليت)" },
  { key: "washingMachines", label: "غسالات" },
  { key: "refrigerators", label: "ثلاجات" },
  { key: "fans", label: "مراوح" },
  { key: "freezers", label: "فريزرات" },
  { key: "ovens", label: "أفران" },
  { key: "heaters", label: "سخانات" },
  { key: "spaceHeaters", label: "دفايات" },
  { key: "computers", label: "كمبيوترات" },
  { key: "phones", label: "جوالات" },
  { key: "tvScreens", label: "تلفزيونات / شاشات" },
  { key: "mattresses", label: "مراتب / فرش" },
  { key: "wardrobes", label: "دولاب" },
  { key: "blankets", label: "بطانيات" },
  { key: "cars", label: "عدد السيارات" },
]

const CONDITION_KEYS: { key: keyof Omit<ApplianceCondition, "notes">; label: string }[] = [
  { key: "good", label: "جيدة" },
  { key: "unavailable", label: "غير متوفر" },
  { key: "needsRepair", label: "إصلاح" },
  { key: "needsReplacement", label: "استبدال" },
]

// --- Income Sources ---

const INCOME_KEYS: { key: string; label: string }[] = [
  { key: "salary", label: "الراتب" },
  { key: "socialInsurance", label: "التأمينات الاجتماعية" },
  { key: "modernSocialSecurity", label: "الضمان الاجتماعي المطور" },
  { key: "citizenAccount", label: "حساب المواطن" },
  { key: "pension", label: "راتب تقاعدي" },
  { key: "disabilityAid", label: "مساعدة معوقين (التأهيل الشامل)" },
  { key: "alimony", label: "النفقة" },
  { key: "freelance", label: "عمل حر (تقديري)" },
  { key: "other", label: "أخرى" },
]

// --- Financial Obligations ---

const OBLIGATION_KEYS: { key: string; label: string }[] = [
  { key: "rent", label: "إيجار سكن" },
  { key: "loanPayment", label: "تسديد قرض" },
  { key: "carInstallment", label: "أقساط سيارة" },
  { key: "domesticWorker", label: "عاملة منزلية / عامل" },
  { key: "other", label: "أخرى" },
]

// --- Religious visits ---

const RELIGIOUS_KEYS: { key: keyof ReligiousVisits; label: string }[] = [
  { key: "hajj", label: "هل تم تأدية الحج" },
  { key: "umrah", label: "هل تم تأدية العمرة" },
  { key: "prophetMosque", label: "هل تمت زيارة المسجد النبوي" },
]

// --- Default JSON values ---

function defaultApplianceCondition(): ApplianceCondition {
  return { good: 0, unavailable: 0, needsRepair: 0, needsReplacement: 0, notes: "" }
}

function defaultReligiousItem(): ReligiousItem {
  return { done: false }
}

function defaultIncomeItem(): IncomeItem {
  return { monthly: 0, yearly: 0, notes: "" }
}

function defaultObligationItem(): ObligationItem {
  return { monthly: 0, yearly: 0, notes: "" }
}

function initFurniture(data: FurnitureAppliances | null): FurnitureAppliances {
  const result: FurnitureAppliances = {}
  for (const { key } of APPLIANCE_KEYS) {
    result[key] = data?.[key] ?? defaultApplianceCondition()
  }
  return result
}

function initIncome(data: IncomeSources | null): IncomeSources {
  const result: IncomeSources = {}
  for (const { key } of INCOME_KEYS) {
    result[key] = data?.[key] ?? defaultIncomeItem()
  }
  return result
}

function initObligations(data: FinancialObligations | null): FinancialObligations {
  const result: FinancialObligations = {}
  for (const { key } of OBLIGATION_KEYS) {
    result[key] = data?.[key] ?? defaultObligationItem()
  }
  return result
}

function initReligious(data: ReligiousVisits | null): ReligiousVisits {
  const result: ReligiousVisits = {}
  for (const { key } of RELIGIOUS_KEYS) {
    result[key] = data?.[key] ?? defaultReligiousItem()
  }
  return result
}

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

  const canEdit = auth.hasPermission("edit_profile")
  const canAssignCategory = auth.hasPermission("assign_category")

  // --- Form state ---
  const [form, setForm] = React.useState({
    name: "",
    nationalId: "",
    gender: "",
    dateOfBirth: "",
    maritalStatus: "",
    phone: "",
    otherPhone: "",
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
    attributes: "",
    enrollment: "",
    visitDate: "",
    updateDone: "",
    nextUpdate: "",
    specialDate: "",
    healthStatus: "",
    origin: "",
    familySkillsTalents: "",
    researcherNotes: "",
    notes: "",
  })

  const [husbandReligious, setHusbandReligious] = React.useState<ReligiousVisits>({})
  const [wifeReligious, setWifeReligious] = React.useState<ReligiousVisits>({})
  const [furniture, setFurniture] = React.useState<FurnitureAppliances>({})
  const [income, setIncome] = React.useState<IncomeSources>({})
  const [obligations, setObligations] = React.useState<FinancialObligations>({})

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
      setForm({
        name: b.name || "",
        nationalId: b.nationalId,
        gender: b.gender || "",
        dateOfBirth: b.dateOfBirth || "",
        maritalStatus: b.maritalStatus || "",
        phone: b.phone || "",
        otherPhone: b.otherPhone || "",
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
        attributes: b.attributes || "",
        enrollment: b.enrollment || "",
        visitDate: b.visitDate ? b.visitDate.split("T")[0] : "",
        updateDone: b.updateDone ? b.updateDone.split("T")[0] : "",
        nextUpdate: b.nextUpdate ? b.nextUpdate.split("T")[0] : "",
        specialDate: b.specialDate ? b.specialDate.split("T")[0] : "",
        healthStatus: b.healthStatus || "",
        origin: b.origin || "",
        familySkillsTalents: b.familySkillsTalents || "",
        researcherNotes: b.researcherNotes || "",
        notes: b.notes || "",
      })
      setHusbandReligious(initReligious(b.husbandReligious))
      setWifeReligious(initReligious(b.wifeReligious))
      setFurniture(initFurniture(b.furnitureAppliances))
      setIncome(initIncome(b.incomeSources))
      setObligations(initObligations(b.financialObligations))
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
      const numOrUndef = (v: string) => (v !== "" ? Number(v) : undefined)
      await beneficiariesApi.updateBeneficiary(beneficiary.id, {
        name: form.name || undefined,
        nationalId: form.nationalId,
        gender: (form.gender as "male" | "female") || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        maritalStatus: form.maritalStatus || undefined,
        phone: form.phone || undefined,
        otherPhone: form.otherPhone || undefined,
        familyCount: numOrUndef(form.familyCount),
        iban: form.iban || undefined,
        bank: form.bank || undefined,
        residenceArea: form.residenceArea || undefined,
        residenceAreaOther: form.residenceAreaOther || undefined,
        buildingOwnership: form.buildingOwnership || undefined,
        buildingType: form.buildingType || undefined,
        buildingTypeOther: form.buildingTypeOther || undefined,
        buildingCondition: form.buildingCondition || undefined,
        buildingCapacity: form.buildingCapacity || undefined,
        husbandReligious: husbandReligious,
        wifeReligious: wifeReligious,
        furnitureAppliances: furniture,
        incomeSources: income,
        financialObligations: obligations,
        attributes: form.attributes || undefined,
        enrollment: form.enrollment || undefined,
        visitDate: form.visitDate || undefined,
        updateDone: form.updateDone || undefined,
        nextUpdate: form.nextUpdate || undefined,
        specialDate: form.specialDate || undefined,
        healthStatus: form.healthStatus || undefined,
        origin: form.origin || undefined,
        familySkillsTalents: form.familySkillsTalents || undefined,
        researcherNotes: form.researcherNotes || undefined,
        notes: form.notes || undefined,
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

  // --- Computed income totals ---
  const totalMonthlyIncome = INCOME_KEYS.reduce(
    (sum, { key }) => sum + (income[key]?.monthly ?? 0),
    0
  )
  const totalYearlyIncome = INCOME_KEYS.reduce(
    (sum, { key }) => sum + (income[key]?.yearly ?? 0),
    0
  )
  const familyCountNum = form.familyCount ? Number(form.familyCount) : 0
  const perCapita = familyCountNum > 0 ? Math.round(totalMonthlyIncome / familyCountNum) : 0

  const totalMonthlyObligations = OBLIGATION_KEYS.reduce(
    (sum, { key }) => sum + (obligations[key]?.monthly ?? 0),
    0
  )
  const totalYearlyObligations = OBLIGATION_KEYS.reduce(
    (sum, { key }) => sum + (obligations[key]?.yearly ?? 0),
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
        </div>
        <div className="flex items-center gap-2">
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
            <Input dir="ltr" className="text-start" value={form.nationalId} onChange={(e) => updateField("nationalId", e.target.value)} disabled={!canEdit} />
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

      {/* === Section 3: Financial  IBAN/Bank === */}
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
                <TableHead className="min-w-24">سنوي</TableHead>
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
                      type="number"
                      className="w-24"
                      value={income[key]?.yearly ?? 0}
                      onChange={(e) =>
                        setIncome((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], yearly: Number(e.target.value) || 0 },
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
                <TableCell>{totalYearlyIncome.toLocaleString("en")}</TableCell>
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
                <TableHead className="min-w-24">سنوي</TableHead>
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
                      type="number"
                      className="w-24"
                      value={obligations[key]?.yearly ?? 0}
                      onChange={(e) =>
                        setObligations((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], yearly: Number(e.target.value) || 0 },
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
                <TableCell>{totalYearlyObligations.toLocaleString("en")}</TableCell>
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReligiousSection
            title="الزوج"
            data={husbandReligious}
            onChange={setHusbandReligious}
            disabled={!canEdit}
          />
          <ReligiousSection
            title="الزوجة"
            data={wifeReligious}
            onChange={setWifeReligious}
            disabled={!canEdit}
          />
        </div>
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
                      value={furniture[key]?.notes ?? ""}
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
          <Field label="التسجيل">
            <Input value={form.enrollment} onChange={(e) => updateField("enrollment", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="الصفات">
            <Input value={form.attributes} onChange={(e) => updateField("attributes", e.target.value)} disabled={!canEdit} />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="تاريخ الزيارة">
            <Input type="date" value={form.visitDate} onChange={(e) => updateField("visitDate", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="هل تم التحديث">
            <Input type="date" value={form.updateDone} onChange={(e) => updateField("updateDone", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="التحديث القادم">
            <Input type="date" value={form.nextUpdate} onChange={(e) => updateField("nextUpdate", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="تاريخ مميز">
            <Input type="date" value={form.specialDate} onChange={(e) => updateField("specialDate", e.target.value)} disabled={!canEdit} />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="الحالة الصحية">
            <Textarea value={form.healthStatus} onChange={(e) => updateField("healthStatus", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="المهن والمواهب لأفراد العائلة">
            <Textarea value={form.familySkillsTalents} onChange={(e) => updateField("familySkillsTalents", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="ملاحظات وتوصيات الباحث">
            <Textarea value={form.researcherNotes} onChange={(e) => updateField("researcherNotes", e.target.value)} disabled={!canEdit} />
          </Field>
          <Field label="ملاحظات">
            <Textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} disabled={!canEdit} />
          </Field>
        </div>
      </section>

      <Separator />

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

        {/* Inline dependent form */}
        {(createDepOpen || editDep) && (
          <DependentFormSection
            beneficiaryId={beneficiary.id}
            dependent={editDep}
            onCancel={() => { setCreateDepOpen(false); setEditDep(null) }}
            onSuccess={() => { setCreateDepOpen(false); setEditDep(null); loadData() }}
          />
        )}
        {beneficiary.dependents.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>رقم الهوية</TableHead>
                  <TableHead>الجنس</TableHead>
                  <TableHead>تاريخ الميلاد</TableHead>
                  <TableHead>صلة القرابة</TableHead>
                  <TableHead>الحالة التعليمية</TableHead>
                  {canEdit && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {beneficiary.dependents.map((dep) => (
                  <TableRow key={dep.id}>
                    <TableCell className="font-medium">{dep.name || ""}</TableCell>
                    <TableCell dir="ltr" className="text-start">{dep.nationalId || ""}</TableCell>
                    <TableCell>{dep.gender ? GENDER_LABELS[dep.gender] : ""}</TableCell>
                    <TableCell>{dep.dateOfBirth || ""}</TableCell>
                    <TableCell>
                      {dep.relationship
                        ? dep.relationship === "other"
                          ? dep.relationshipOther || "أخرى"
                          : RELATIONSHIP_LABELS[dep.relationship]
                        : ""}
                    </TableCell>
                    <TableCell>{dep.educationStatus ? EDUCATION_LABELS[dep.educationStatus] : ""}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditDep(dep)}>
                              <Pencil className="size-4" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteDep(dep)} className="text-destructive">
                              <Trash2 className="size-4" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">لا يوجد تابعين</p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {beneficiary.disbursements.map((d: BeneficiaryDisbursement) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.program.name}</TableCell>
                    <TableCell>{new Date(d.disbursedAt).toLocaleDateString("en")}</TableCell>
                    <TableCell>{d.disbursedBy.name}</TableCell>
                    <TableCell>{d.receiverName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{d.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Metadata */}
      <Separator />
      <div className="mt-6 flex gap-6 text-sm text-muted-foreground">
        <span>أنشئ بواسطة: {beneficiary.createdBy.name}</span>
        <span>
          تاريخ الإنشاء:{" "}
          {new Date(beneficiary.createdAt).toLocaleDateString("en")}
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
    </div>
  )
}

// ===========================================================================
// Sub-components
// ===========================================================================

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

// --- Religious Section ---

function ReligiousSection({
  title,
  data,
  onChange,
  disabled,
}: {
  title: string
  data: ReligiousVisits
  onChange: React.Dispatch<React.SetStateAction<ReligiousVisits>>
  disabled: boolean
}) {
  function updateItem(key: keyof ReligiousVisits, field: string, value: unknown) {
    onChange((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="space-y-4">
        {RELIGIOUS_KEYS.map(({ key, label }) => {
          const item = data[key] ?? defaultReligiousItem()
          return (
            <div key={key}>
              <div className="flex items-center gap-3">
                <Switch
                  checked={item.done}
                  onCheckedChange={(checked) => updateItem(key, "done", checked)}
                  disabled={disabled}
                />
                <span className="text-sm">{label}</span>
              </div>
              {item.done && (
                <div className="mt-2 grid grid-cols-3 gap-2 ps-10">
                  <Field label="تاريخ الأداء">
                    <Input
                      type="date"
                      value={item.visitDate || ""}
                      onChange={(e) => updateItem(key, "visitDate", e.target.value)}
                      disabled={disabled}
                    />
                  </Field>
                  <Field label="تاريخ التحديث">
                    <Input
                      type="date"
                      value={item.updateDate || ""}
                      onChange={(e) => updateItem(key, "updateDate", e.target.value)}
                      disabled={disabled}
                    />
                  </Field>
                  <Field label="التحديث القادم">
                    <Input
                      type="date"
                      value={item.nextUpdate || ""}
                      onChange={(e) => updateItem(key, "nextUpdate", e.target.value)}
                      disabled={disabled}
                    />
                  </Field>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Assign Category Dialog ---

function AssignCategoryDialog({
  beneficiaryId,
  currentCategoryId,
  categories,
  open,
  onOpenChange,
  onSuccess,
}: {
  beneficiaryId: number
  currentCategoryId: number | null
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [categoryId, setCategoryId] = React.useState("")
  const [note, setNote] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setCategoryId(currentCategoryId ? String(currentCategoryId) : "")
      setNote("")
    }
  }, [open, currentCategoryId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryId || !note.trim()) return
    setSubmitting(true)
    try {
      await beneficiariesApi.assignCategory(beneficiaryId, {
        categoryId: Number(categoryId),
        note: note.trim(),
      })
      toast.success("تم تعيين الفئة بنجاح")
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ غير متوقع")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تعيين الفئة</DialogTitle>
          <DialogDescription>اختر الفئة الجديدة وأدخل سبب التعيين</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>الفئة</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assign-note">السبب (إلزامي)</Label>
            <Textarea
              id="assign-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="سبب تعيين أو تغيير الفئة..."
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting || !categoryId || !note.trim()}>
              {submitting && <LoaderCircle className="animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// --- Category History Dialog ---

function CategoryHistoryDialog({
  beneficiaryId,
  open,
  onOpenChange,
}: {
  beneficiaryId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [history, setHistory] = React.useState<CategoryHistoryEntry[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setLoading(true)
    beneficiariesApi
      .getCategoryHistory(beneficiaryId)
      .then((res) => setHistory(res.history))
      .catch((err) => {
        if (err instanceof ApiError) toast.error(err.message)
      })
      .finally(() => setLoading(false))
  }, [open, beneficiaryId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>سجل تغيير الفئة</DialogTitle>
          <DialogDescription>جميع التغييرات على فئة المستفيد</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-6">
            <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            لا يوجد سجل تغييرات
          </p>
        ) : (
          <div className="max-h-[50vh] space-y-3 overflow-y-auto">
            {history.map((entry) => (
              <div key={entry.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm">
                  {entry.previousCategory ? (
                    <>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: entry.previousCategory.color,
                          color: entry.previousCategory.color,
                        }}
                      >
                        {entry.previousCategory.name}
                      </Badge>
                      <span className="text-muted-foreground"></span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">بدون فئة </span>
                  )}
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: entry.category.color,
                      color: entry.category.color,
                    }}
                  >
                    {entry.category.name}
                  </Badge>
                </div>
                <p className="mt-1 text-sm">{entry.note}</p>
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                  <span>بواسطة: {entry.assignedBy.name}</span>
                  <span>
                    {new Date(entry.createdAt).toLocaleDateString("en", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// --- Dependent Form Section (inline) ---

function DependentFormSection({
  beneficiaryId,
  dependent,
  onCancel,
  onSuccess,
}: {
  beneficiaryId: number
  dependent?: Dependent | null
  onCancel: () => void
  onSuccess: () => void
}) {
  const isEdit = !!dependent
  const [name, setName] = React.useState("")
  const [nationalId, setNationalId] = React.useState("")
  const [gender, setGender] = React.useState("")
  const [dateOfBirth, setDateOfBirth] = React.useState("")
  const [relationship, setRelationship] = React.useState("")
  const [relationshipOther, setRelationshipOther] = React.useState("")
  const [dependentMaritalStatus, setDependentMaritalStatus] = React.useState("")
  const [schoolName, setSchoolName] = React.useState("")
  const [schoolGrade, setSchoolGrade] = React.useState("")
  const [schoolType, setSchoolType] = React.useState("")
  const [schoolTypeOther, setSchoolTypeOther] = React.useState("")
  const [academicGrade, setAcademicGrade] = React.useState("")
  const [weaknessSubjects, setWeaknessSubjects] = React.useState("")
  const [educationStatus, setEducationStatus] = React.useState("")
  const [healthStatus, setHealthStatus] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (dependent) {
      setName(dependent.name || "")
      setNationalId(dependent.nationalId || "")
      setGender(dependent.gender || "")
      setDateOfBirth(dependent.dateOfBirth || "")
      setRelationship(dependent.relationship || "")
      setRelationshipOther(dependent.relationshipOther || "")
      setDependentMaritalStatus(dependent.dependentMaritalStatus || "")
      setSchoolName(dependent.schoolName || "")
      setSchoolGrade(dependent.schoolGrade || "")
      setSchoolType(dependent.schoolType || "")
      setSchoolTypeOther(dependent.schoolTypeOther || "")
      setAcademicGrade(dependent.academicGrade || "")
      setWeaknessSubjects(dependent.weaknessSubjects || "")
      setEducationStatus(dependent.educationStatus || "")
      setHealthStatus(dependent.healthStatus || "")
      setNotes(dependent.notes || "")
    } else {
      setName("")
      setNationalId("")
      setGender("")
      setDateOfBirth("")
      setRelationship("")
      setRelationshipOther("")
      setDependentMaritalStatus("")
      setSchoolName("")
      setSchoolGrade("")
      setSchoolType("")
      setSchoolTypeOther("")
      setAcademicGrade("")
      setWeaknessSubjects("")
      setEducationStatus("")
      setHealthStatus("")
      setNotes("")
    }
  }, [dependent])

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
        healthStatus: healthStatus || undefined,
        notes: notes || undefined,
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
            <Label htmlFor="dep-health">الحالة الصحية</Label>
            <Textarea id="dep-health" value={healthStatus} onChange={(e) => setHealthStatus(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dep-notes">ملاحظات</Label>
            <Textarea id="dep-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
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
