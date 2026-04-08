import type {
  ReligiousVisits,
  ReligiousItem,
  FurnitureAppliances,
  ApplianceCondition,
  IncomeSources,
  IncomeItem,
  FinancialObligations,
  ObligationItem,
  DependentReligious,
  DependentReligiousItem,
} from "@/types/beneficiaries"

// --- Label Maps ---

export const MARITAL_LABELS: Record<string, string> = {
  married: "متزوج / متزوجة",
  single: "أعزب / عزباء",
  divorced: "مطلقة",
  widowed: "أرملة",
  abandoned: "مهجورة",
}

export const EDUCATION_LABELS: Record<string, string> = {
  enrolled: "ملتحق",
  graduated: "متخرج",
  dropped_out: "منقطع",
  not_enrolled: "غير ملتحق",
}

export const SCHOOL_TYPE_LABELS: Record<string, string> = {
  public: "حكومية",
  private: "أهلية",
  other: "أخرى",
}

export const RELATIONSHIP_LABELS: Record<string, string> = {
  son: "ابن",
  daughter: "ابنة",
  wife: "زوجة",
  other: "أخرى",
}

export const RESIDENCE_AREA_LABELS: Record<string, string> = {
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

export const BUILDING_OWNERSHIP_LABELS: Record<string, string> = {
  private: "ملك خاص",
  shared: "مشترك",
  rented: "مستأجر",
  charity_house: "منزل خيري",
  developmental_housing: "اسكان تنموي",
}

export const BUILDING_TYPE_LABELS: Record<string, string> = {
  arabic: "عربي",
  concrete: "مسلح",
  other: "غيره",
}

export const BUILDING_CONDITION_LABELS: Record<string, string> = {
  good: "جيدة",
  average: "متوسطة",
  needs_repair: "بحاجة لإصلاح",
}

export const BUILDING_CAPACITY_LABELS: Record<string, string> = {
  small: "صغير (لا يكفي الأسرة)",
  medium: "متوسط",
  sufficient: "يكفي الأسرة",
}

// --- Key Arrays ---

export const APPLIANCE_KEYS: { key: string; label: string }[] = [
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

export const CONDITION_KEYS: { key: keyof Omit<ApplianceCondition, "notes">; label: string }[] = [
  { key: "good", label: "جيدة" },
  { key: "unavailable", label: "غير متوفر" },
  { key: "needsRepair", label: "إصلاح" },
  { key: "needsReplacement", label: "استبدال" },
]

export const INCOME_KEYS: { key: string; label: string }[] = [
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

export const OBLIGATION_KEYS: { key: string; label: string }[] = [
  { key: "rent", label: "إيجار سكن" },
  { key: "loanPayment", label: "تسديد قرض" },
  { key: "carInstallment", label: "أقساط سيارة" },
  { key: "domesticWorker", label: "عاملة منزلية / عامل" },
  { key: "other", label: "أخرى" },
]

export const RELIGIOUS_KEYS: { key: keyof ReligiousVisits; label: string }[] = [
  { key: "hajj", label: "هل تم تأدية الحج" },
  { key: "umrah", label: "هل تم تأدية العمرة" },
  { key: "prophetMosque", label: "هل تمت زيارة المسجد النبوي" },
]

export const DEP_RELIGIOUS_KEYS: { key: keyof DependentReligious; label: string }[] = [
  { key: "hajj", label: "هل تم تأدية الحج" },
  { key: "umrah", label: "هل تم تأدية العمرة" },
  { key: "prophetMosque", label: "هل تمت زيارة المسجد النبوي" },
]

// --- Helper / Init Functions ---

export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null
  const birth = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function defaultDependentReligiousItem(): DependentReligiousItem {
  return { done: false }
}

export function initDependentReligious(data: DependentReligious | null): DependentReligious {
  const result: DependentReligious = {}
  for (const { key } of DEP_RELIGIOUS_KEYS) {
    result[key] = data?.[key] ?? defaultDependentReligiousItem()
  }
  return result
}

export function defaultApplianceCondition(): ApplianceCondition {
  return { good: 0, unavailable: 0, needsRepair: 0, needsReplacement: 0, notes: "" }
}

export function defaultReligiousItem(): ReligiousItem {
  return { done: false }
}

export function defaultIncomeItem(): IncomeItem {
  return { monthly: 0, notes: "" }
}

export function defaultObligationItem(): ObligationItem {
  return { monthly: 0, notes: "" }
}

export function initFurniture(data: FurnitureAppliances | null): FurnitureAppliances {
  const result: FurnitureAppliances = {}
  for (const { key } of APPLIANCE_KEYS) {
    result[key] = data?.[key] ?? defaultApplianceCondition()
  }
  return result
}

export function initIncome(data: IncomeSources | null): IncomeSources {
  const result: IncomeSources = {}
  for (const { key } of INCOME_KEYS) {
    result[key] = data?.[key] ?? defaultIncomeItem()
  }
  return result
}

export function initObligations(data: FinancialObligations | null): FinancialObligations {
  const result: FinancialObligations = {}
  for (const { key } of OBLIGATION_KEYS) {
    result[key] = data?.[key] ?? defaultObligationItem()
  }
  return result
}

export function initReligious(data: ReligiousVisits | null): ReligiousVisits {
  const result: ReligiousVisits = {}
  for (const { key } of RELIGIOUS_KEYS) {
    result[key] = data?.[key] ?? defaultReligiousItem()
  }
  return result
}
