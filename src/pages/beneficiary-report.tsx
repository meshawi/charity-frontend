import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import * as beneficiariesApi from "@/lib/beneficiaries-api"
import { getAcknowledgmentUrl } from "@/lib/disbursements-api"
import type {
  Beneficiary,
  BeneficiaryDisbursement,
  Dependent,
  DependentReligiousItem,
} from "@/types/beneficiaries"
import { GENDER_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants"
import { formatDate } from "@/lib/date-utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoaderCircle, ArrowRight, Printer } from "lucide-react"
import { ViewField } from "@/components/beneficiary/field"
import {
  MARITAL_LABELS,
  EDUCATION_LABELS,
  SCHOOL_TYPE_LABELS,
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
  RELIGIOUS_KEYS,
  DEP_RELIGIOUS_KEYS,
} from "@/lib/beneficiary-constants"

export default function BeneficiaryReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [beneficiary, setBeneficiary] = React.useState<Beneficiary | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!id) return
    beneficiariesApi
      .getBeneficiary(Number(id))
      .then((res) => setBeneficiary(res.beneficiary))
      .catch(() => toast.error("حدث خطأ في تحميل بيانات المستفيد"))
      .finally(() => setLoading(false))
  }, [id])

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

  const totalMonthlyIncome = INCOME_KEYS.reduce(
    (sum, { key }) => sum + (beneficiary.incomeSources?.[key]?.monthly ?? 0),
    0
  )
  const rentDed = beneficiary.rentDeduction ?? 0
  const netIncome = totalMonthlyIncome - rentDed
  const familyCountNum = beneficiary.familyCount ?? 0
  const perCapita = familyCountNum > 0 ? Math.round(netIncome / familyCountNum) : 0

  const totalMonthlyObligations = OBLIGATION_KEYS.reduce(
    (sum, { key }) => sum + (beneficiary.financialObligations?.[key]?.monthly ?? 0),
    0
  )

  return (
    <div className="p-6 print:p-0">
      {/* Header (hides on print) */}

      {/* === Report Header === */}
      <div className="mb-6 rounded-lg border p-4 print:border-black">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{beneficiary.name || "—"}</h2>
            <p className="text-sm text-muted-foreground">
              {beneficiary.beneficiaryNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>

      {/* === Basic Information === */}
      <ReportSection title="المعلومات الأساسية">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ViewField label="الاسم" value={beneficiary.name} />
          <ViewField label="رقم الهوية" value={beneficiary.nationalId} />
          <ViewField label="الجنس" value={beneficiary.gender ? GENDER_LABELS[beneficiary.gender] : null} />
          <ViewField label="تاريخ الميلاد" value={beneficiary.dateOfBirth ? `${beneficiary.dateOfBirth}${beneficiary.age != null ? ` (${beneficiary.age} سنة)` : ""}` : null} />
          <ViewField label="الحالة الاجتماعية" value={beneficiary.maritalStatus ? MARITAL_LABELS[beneficiary.maritalStatus] : null} />
          <ViewField label="الهاتف" value={beneficiary.phone} />
          <ViewField label="هاتف آخر" value={beneficiary.otherPhone} />
          <ViewField label="صلة صاحب الجوال الآخر" value={beneficiary.otherPhoneRelationship} />
          <ViewField label="عدد أفراد الأسرة" value={beneficiary.familyCount} />
          <ViewField label="عدد التابعين" value={beneficiary.dependentsCount} />
          <ViewField label="الأصل / المنطقة" value={beneficiary.origin} />
        </div>
      </ReportSection>

      {/* === Residence & Building === */}
      <ReportSection title="السكن والبناء">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ViewField label="جهة السكن بالطرف" value={beneficiary.residenceArea === "other" ? beneficiary.residenceAreaOther : beneficiary.residenceArea ? RESIDENCE_AREA_LABELS[beneficiary.residenceArea] : null} />
          <ViewField label="ملكية البناء" value={beneficiary.buildingOwnership ? BUILDING_OWNERSHIP_LABELS[beneficiary.buildingOwnership] : null} />
          <ViewField label="نوع البناء" value={beneficiary.buildingType === "other" ? beneficiary.buildingTypeOther : beneficiary.buildingType ? BUILDING_TYPE_LABELS[beneficiary.buildingType] : null} />
          <ViewField label="حالة البناء" value={beneficiary.buildingCondition ? BUILDING_CONDITION_LABELS[beneficiary.buildingCondition] : null} />
          <ViewField label="اتساع البناء" value={beneficiary.buildingCapacity ? BUILDING_CAPACITY_LABELS[beneficiary.buildingCapacity] : null} />
        </div>
      </ReportSection>

      {/* === Financial === */}
      <ReportSection title="المعلومات المالية">
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ViewField label="IBAN" value={beneficiary.iban} />
          <ViewField label="البنك" value={beneficiary.bank} />
        </div>
      </ReportSection>

      {/* === Income Sources === */}
      <ReportSection title="مصادر الدخل">
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
              {INCOME_KEYS.map(({ key, label }) => {
                const item = beneficiary.incomeSources?.[key]
                if (!item || (item.monthly === 0 && !item.notes)) return null
                return (
                  <TableRow key={key}>
                    <TableCell className="text-sm font-medium">{label}</TableCell>
                    <TableCell>{item.monthly.toLocaleString("en")}</TableCell>
                    <TableCell className="text-muted-foreground">{item.notes || "—"}</TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="bg-muted/30 font-medium">
                <TableCell>المجموع</TableCell>
                <TableCell>{totalMonthlyIncome.toLocaleString("en")}</TableCell>
                <TableCell />
              </TableRow>
              {rentDed > 0 && (
                <TableRow className="bg-muted/30 font-medium">
                  <TableCell>خصم الإيجار</TableCell>
                  <TableCell>{rentDed.toLocaleString("en")}</TableCell>
                  <TableCell />
                </TableRow>
              )}
              <TableRow className="bg-muted/30 font-medium">
                <TableCell>صافي الدخل</TableCell>
                <TableCell>{netIncome.toLocaleString("en")}</TableCell>
                <TableCell className="text-xs">نصيب الفرد: {perCapita.toLocaleString("en")}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </ReportSection>

      {/* === Obligations === */}
      <ReportSection title="الالتزامات المالية">
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
              {OBLIGATION_KEYS.map(({ key, label }) => {
                const item = beneficiary.financialObligations?.[key]
                if (!item || (item.monthly === 0 && !item.notes)) return null
                return (
                  <TableRow key={key}>
                    <TableCell className="text-sm font-medium">{label}</TableCell>
                    <TableCell>{item.monthly.toLocaleString("en")}</TableCell>
                    <TableCell className="text-muted-foreground">{item.notes || "—"}</TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="bg-muted/30 font-medium">
                <TableCell>المجموع</TableCell>
                <TableCell>{totalMonthlyObligations.toLocaleString("en")}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </ReportSection>

      {/* === Religious Visits === */}
      <ReportSection title="الزيارات الدينية">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {RELIGIOUS_KEYS.map(({ key, label }) => {
            const item = beneficiary.husbandReligious?.[key]
            return (
              <div key={key} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-sm font-medium ${item?.done ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                  {item?.done ? "نعم" : "لا"}
                </span>
                {item?.done && item.visitDate && (
                  <span className="text-xs text-muted-foreground">{item.visitDate}</span>
                )}
              </div>
            )
          })}
        </div>
      </ReportSection>

      {/* === Furniture === */}
      {APPLIANCE_KEYS.some(({ key }) => {
        const item = beneficiary.furnitureAppliances?.[key]
        return item && (item.good > 0 || item.unavailable > 0 || item.needsRepair > 0 || item.needsReplacement > 0 || item.notes)
      }) && (
        <ReportSection title="الأثاث والأجهزة والممتلكات">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-28">العنصر</TableHead>
                  {CONDITION_KEYS.map(({ key, label }) => (
                    <TableHead key={key} className="min-w-16 text-center">{label}</TableHead>
                  ))}
                  <TableHead className="min-w-28">ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {APPLIANCE_KEYS.map(({ key, label }) => {
                  const item = beneficiary.furnitureAppliances?.[key]
                  const hasData = item && (item.good > 0 || item.unavailable > 0 || item.needsRepair > 0 || item.needsReplacement > 0 || item.notes)
                  if (!hasData) return null
                  return (
                    <TableRow key={key}>
                      <TableCell className="text-sm font-medium">{label}</TableCell>
                      {CONDITION_KEYS.map(({ key: ck }) => (
                        <TableCell key={ck} className="text-center">{item?.[ck] ?? 0}</TableCell>
                      ))}
                      <TableCell className="text-muted-foreground">{item?.notes || "—"}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </ReportSection>
      )}

      {/* === Health & Additional === */}
      <ReportSection title="معلومات إضافية">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ViewField label="اسم الباحث" value={beneficiary.researcherName} />
          <ViewField label="تاريخ الزيارة الأولى" value={beneficiary.firstVisitDate ? formatDate(beneficiary.firstVisitDate) : null} />
          <ViewField label="تاريخ التحديث" value={beneficiary.updateDate ? formatDate(beneficiary.updateDate) : null} />
          <ViewField label="التحديث القادم" value={beneficiary.nextUpdate ? formatDate(beneficiary.nextUpdate) : null} />
          <ViewField label="الحالة الصحية" value={beneficiary.healthCondition === "unhealthy" ? `غير سليم — ${beneficiary.healthStatus || ""}` : beneficiary.healthCondition === "healthy" ? "سليم" : null} />
          <ViewField label="المهن والمواهب لأفراد العائلة" value={beneficiary.familySkillsTalents} />
          <ViewField label="ملاحظات وتوصيات الباحث" value={beneficiary.researcherNotes} />
        </div>
      </ReportSection>

      {/* === Dependents === */}
      {beneficiary.dependents.length > 0 && (
        <ReportSection title={`التابعين (${beneficiary.dependents.length})`}>
          <div className="space-y-4">
            {beneficiary.dependents.map((dep, idx) => (
              <DependentReport key={dep.id} dep={dep} index={idx + 1} />
            ))}
          </div>
        </ReportSection>
      )}

      {/* === Documents === */}
      {beneficiary.documents?.length > 0 && (
        <ReportSection title={`المستندات (${beneficiary.documents.length})`}>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>اسم الملف</TableHead>
                  <TableHead>ملاحظات</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beneficiary.documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.type || "—"}</TableCell>
                    <TableCell>{doc.name}</TableCell>
                    <TableCell className="text-muted-foreground">{doc.notes || "—"}</TableCell>
                    <TableCell>{formatDate(doc.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ReportSection>
      )}

      {/* === Disbursements === */}
      {beneficiary.disbursements?.length > 0 && (
        <ReportSection title={`البرامج المستلمة (${beneficiary.disbursements.length})`}>
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
                    <TableCell>{formatDate(d.disbursedAt)}</TableCell>
                    <TableCell>{d.disbursedBy.name}</TableCell>
                    <TableCell>{d.receiverName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{d.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ReportSection>
      )}

      {/* Metadata */}
      <Separator className="my-4" />
      <div className="flex gap-6 text-sm text-muted-foreground">
        <span>أنشئ بواسطة: {beneficiary.createdBy.name}</span>
        <span>تاريخ الإنشاء: {formatDate(beneficiary.createdAt)}</span>
      </div>
    </div>
  )
}

// ===========================================================================

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 border-b pb-1 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function DependentReport({ dep, index }: { dep: Dependent; index: number }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground">{index}.</span>
        <span className="text-sm font-semibold">{dep.name || "—"}</span>
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
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ViewField label="رقم الهوية" value={dep.nationalId} />
        <ViewField label="تاريخ الميلاد" value={dep.dateOfBirth} />
        <ViewField label="العمر" value={dep.age != null ? String(dep.age) : null} />
        <ViewField label="الحالة الاجتماعية" value={dep.dependentMaritalStatus || null} />
      </div>

      {dep.educationStatus && (
        <>
          <Separator className="my-3" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ViewField label="الحالة التعليمية" value={EDUCATION_LABELS[dep.educationStatus]} />
            <ViewField label="المدرسة" value={dep.schoolName} />
            <ViewField label="نوع المدرسة" value={dep.schoolType ? (dep.schoolType === "other" ? dep.schoolTypeOther || "أخرى" : SCHOOL_TYPE_LABELS[dep.schoolType]) : null} />
            <ViewField label="الصف" value={dep.schoolGrade} />
            <ViewField label="التقدير الأكاديمي" value={dep.academicGrade} />
            <ViewField label="مواد الضعف" value={dep.weaknessSubjects} />
          </div>
        </>
      )}

      {dep.healthCondition && (
        <>
          <Separator className="my-3" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ViewField label="الحالة الصحية" value={dep.healthCondition === "healthy" ? "سليم" : "يعاني من مشاكل صحية"} />
            {dep.healthCondition === "unhealthy" && dep.healthStatus && (
              <div className="col-span-2 sm:col-span-3">
                <ViewField label="تفاصيل الحالة الصحية" value={dep.healthStatus} />
              </div>
            )}
          </div>
        </>
      )}

      {dep.religious && (Object.values(dep.religious) as (DependentReligiousItem | undefined)[]).some(v => v?.done) && (
        <>
          <Separator className="my-3" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {DEP_RELIGIOUS_KEYS.map(({ key, label }) => {
              const item = dep.religious?.[key]
              if (!item?.done) return null
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-green-600 font-medium">✓ {label}</span>
                  {item.visitDate && <span className="text-xs text-muted-foreground">({item.visitDate})</span>}
                </div>
              )
            })}
          </div>
        </>
      )}

      {dep.notes && (
        <>
          <Separator className="my-3" />
          <ViewField label="ملاحظات" value={dep.notes} />
        </>
      )}
    </div>
  )
}
