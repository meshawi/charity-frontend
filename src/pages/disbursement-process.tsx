import * as React from "react"
import SignaturePad from "signature_pad"
import { useAuth } from "@/contexts/auth-context"
import * as disbursementsApi from "@/lib/disbursements-api"
import type {
  ActiveProgram,
  EligibleBeneficiary,
  EligibilityProgram,
} from "@/types/disbursements"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LoaderCircle,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileText,
  Eraser,
} from "lucide-react"

type Step = "search" | "eligible" | "not-eligible" | "notes" | "confirm" | "success"

export default function DisbursementProcessPage() {
  const auth = useAuth()
  const canProcess = auth.hasPermission("process_disbursement")

  const [programs, setPrograms] = React.useState<ActiveProgram[]>([])
  const [loadingPrograms, setLoadingPrograms] = React.useState(true)
  const [selectedProgramId, setSelectedProgramId] = React.useState<string>("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [checking, setChecking] = React.useState(false)

  const [step, setStep] = React.useState<Step>("search")
  const [beneficiary, setBeneficiary] =
    React.useState<EligibleBeneficiary | null>(null)
  const [program, setProgram] = React.useState<EligibilityProgram | null>(null)
  const [reason, setReason] = React.useState("")

  const [receiverName, setReceiverName] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [disbursementId, setDisbursementId] = React.useState<number | null>(
    null
  )

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const signaturePadRef = React.useRef<SignaturePad | null>(null)

  React.useEffect(() => {
    if (!canProcess) return
    async function load() {
      try {
        const res = await disbursementsApi.getActivePrograms()
        setPrograms(res.programs)
      } catch (err) {
        if (err instanceof ApiError) toast.error(err.message)
      } finally {
        setLoadingPrograms(false)
      }
    }
    load()
  }, [canProcess])

  // Initialize signature pad when step becomes "eligible"
  React.useEffect(() => {
    if (step !== "eligible") return
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.scale(ratio, ratio)
      signaturePadRef.current?.clear()
    }

    const pad = new SignaturePad(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
    })
    signaturePadRef.current = pad
    resizeCanvas()

    window.addEventListener("resize", resizeCanvas)
    return () => {
      window.removeEventListener("resize", resizeCanvas)
      pad.off()
    }
  }, [step])

  async function handleCheck() {
    if (!selectedProgramId || !searchQuery.trim()) return
    setChecking(true)
    try {
      const res = await disbursementsApi.checkEligibility(
        Number(selectedProgramId),
        searchQuery.trim()
      )
      setBeneficiary(res.beneficiary)
      if (res.eligible) {
        setProgram(res.program ?? null)
        setStep("eligible")
      } else {
        setReason(res.reason ?? "غير مؤهل")
        setStep("not-eligible")
      }
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    } finally {
      setChecking(false)
    }
  }

  function handleProceedToNotes() {
    setStep("notes")
  }

  function handleProceedToConfirm() {
    setStep("confirm")
  }

  async function handleSubmit() {
    if (!beneficiary || !selectedProgramId) return

    setSubmitting(true)
    try {
      const signature = signaturePadRef.current?.isEmpty()
        ? undefined
        : signaturePadRef.current?.toDataURL("image/png")

      const res = await disbursementsApi.createDisbursement({
        beneficiaryId: beneficiary.id,
        programId: Number(selectedProgramId),
        signature,
        receiverName: receiverName.trim() || null,
        notes: notes.trim() || null,
      })
      setDisbursementId(res.disbursement.id)
      setStep("success")
      toast.success("تم الصرف بنجاح")
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setStep("search")
    setSearchQuery("")
    setBeneficiary(null)
    setProgram(null)
    setReason("")
    setReceiverName("")
    setNotes("")
    setDisbursementId(null)
    signaturePadRef.current = null
  }

  function clearSignature() {
    signaturePadRef.current?.clear()
  }

  if (!canProcess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">لا تملك صلاحية التوزيع</p>
      </div>
    )
  }

  if (loadingPrograms) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-medium">التوزيع</h1>
        <p className="text-sm text-muted-foreground">
          صرف مستحقات البرامج للمستفيدين
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span
            className={
              step === "search" ? "font-medium text-foreground" : ""
            }
          >
            1. البحث
          </span>
          <span>←</span>
          <span
            className={
              step === "eligible" ? "font-medium text-foreground" : ""
            }
          >
            2. التحقق والتوقيع
          </span>
          <span>←</span>
          <span
            className={
              step === "notes" ? "font-medium text-foreground" : ""
            }
          >
            3. الملاحظات
          </span>
          <span>←</span>
          <span
            className={
              step === "confirm" || step === "success"
                ? "font-medium text-foreground"
                : ""
            }
          >
            4. التأكيد
          </span>
        </div>

        {/* Step 1: Search */}
        {step === "search" && (
          <Card>
            <CardHeader>
              <CardTitle>بحث عن مستفيد</CardTitle>
              <CardDescription>
                اختر البرنامج وأدخل رقم الهوية أو رقم المستفيد
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>البرنامج</Label>
                <Select
                  value={selectedProgramId}
                  onValueChange={setSelectedProgramId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر البرنامج" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>رقم الهوية أو رقم المستفيد</Label>
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="أدخل رقم الهوية أو رقم المستفيد"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCheck()
                    }}
                  />
                  <Button
                    onClick={handleCheck}
                    disabled={
                      !selectedProgramId ||
                      !searchQuery.trim() ||
                      checking
                    }
                  >
                    {checking ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4" />
                    )}
                    <span className="mr-2">بحث</span>
                  </Button>
                </div>
              </div>
              {programs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  لا توجد برامج نشطة حالياً
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Not eligible */}
        {step === "not-eligible" && beneficiary && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="size-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">غير مؤهل</h3>
                  <p className="mt-1 text-sm text-destructive">{reason}</p>
                </div>
                <div className="w-full rounded-lg border p-4 text-start">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">الاسم</div>
                    <div>{beneficiary.name ?? "—"}</div>
                    <div className="text-muted-foreground">رقم المستفيد</div>
                    <div>{beneficiary.beneficiaryNumber}</div>
                    <div className="text-muted-foreground">رقم الهوية</div>
                    <div dir="ltr" className="text-start">
                      {beneficiary.nationalId}
                    </div>
                    {beneficiary.category && (
                      <>
                        <div className="text-muted-foreground">التصنيف</div>
                        <div>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: beneficiary.category.color,
                              color: beneficiary.category.color,
                            }}
                          >
                            {beneficiary.category.name}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="size-4" />
                  <span className="mr-2">بحث جديد</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Eligible — disclaimer & signature */}
        {step === "eligible" && beneficiary && program && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>مؤهل للصرف</CardTitle>
                  <CardDescription>{program.name}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Beneficiary info */}
              <div className="rounded-lg border p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">الاسم</div>
                  <div className="font-medium">
                    {beneficiary.name ?? "—"}
                  </div>
                  <div className="text-muted-foreground">رقم المستفيد</div>
                  <div>{beneficiary.beneficiaryNumber}</div>
                  <div className="text-muted-foreground">رقم الهوية</div>
                  <div dir="ltr" className="text-start">
                    {beneficiary.nationalId}
                  </div>
                  <div className="text-muted-foreground">الهاتف</div>
                  <div dir="ltr" className="text-start">
                    {beneficiary.phone ?? "—"}
                  </div>
                  {beneficiary.category && (
                    <>
                      <div className="text-muted-foreground">التصنيف</div>
                      <div>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: beneficiary.category.color,
                            color: beneficiary.category.color,
                          }}
                        >
                          {beneficiary.category.name}
                        </Badge>
                      </div>
                    </>
                  )}
                  {beneficiary.dependents &&
                    beneficiary.dependents.length > 0 && (
                      <>
                        <div className="text-muted-foreground">التابعين</div>
                        <div>
                          {beneficiary.dependents
                            .map((d) => d.name ?? d.nationalId)
                            .join("، ")}
                        </div>
                      </>
                    )}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <h4 className="mb-2 text-sm font-medium">إقرار وتعهد</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  أتعهد أنا (المستفيد أو من يمثله) بأن جميع المعلومات التي تم
                  الإدلاء بها (للباحث/ للباحثة) في هذه الاستمارة صحيحة وتوافق
                  الواقع وأقر بأنه قد تم إفهامي بأنه في حالة أنه تم اعتمادي
                  كمستحق فإن مصدر ما يتم صرفه لي هو من الصدقات والكفارات
                  والزكاة الشرعية وعلى ذلك أوقع.
                </p>
              </div>

              {/* Receiver name (optional) */}
              <div className="space-y-2">
                <Label>اسم المستلم (في حال الاستلام نيابةً)</Label>
                <Input
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="اترك فارغاً إذا كان المستفيد نفسه"
                />
              </div>

              {/* Signature pad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>التوقيع</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSignature}
                    type="button"
                  >
                    <Eraser className="size-3" />
                    <span className="mr-1">مسح</span>
                  </Button>
                </div>
                <div className="overflow-hidden rounded-lg border bg-white">
                  <canvas
                    ref={canvasRef}
                    className="h-40 w-full cursor-crosshair"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  وقّع في المربع أعلاه باستخدام الماوس أو اللمس
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleProceedToNotes}>
                  التالي
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Notes */}
        {step === "notes" && beneficiary && program && (
          <Card>
            <CardHeader>
              <CardTitle>الملاحظات</CardTitle>
              <CardDescription>
                أضف أي ملاحظات قبل تأكيد عملية الصرف
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">الاسم</div>
                  <div className="font-medium">{beneficiary.name ?? "—"}</div>
                  <div className="text-muted-foreground">البرنامج</div>
                  <div className="font-medium">{program.name}</div>
                  {beneficiary.category && (
                    <>
                      <div className="text-muted-foreground">التصنيف</div>
                      <div>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: beneficiary.category.color,
                            color: beneficiary.category.color,
                          }}
                        >
                          {beneficiary.category.name}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات اختيارية..."
                  className="min-h-24"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleProceedToConfirm}>
                  التالي
                </Button>
                <Button variant="outline" onClick={() => setStep("eligible")}>
                  رجوع
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirm */}
        {step === "confirm" && beneficiary && program && (
          <Card>
            <CardHeader>
              <CardTitle>تأكيد الصرف</CardTitle>
              <CardDescription>
                تحقق من البيانات ثم اضغط تأكيد
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">الاسم</div>
                  <div className="font-medium">{beneficiary.name ?? "—"}</div>
                  <div className="text-muted-foreground">رقم الهوية</div>
                  <div dir="ltr" className="text-start">{beneficiary.nationalId}</div>
                  <div className="text-muted-foreground">البرنامج</div>
                  <div className="font-medium">{program.name}</div>
                  {beneficiary.category && (
                    <>
                      <div className="text-muted-foreground">التصنيف</div>
                      <div>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: beneficiary.category.color,
                            color: beneficiary.category.color,
                          }}
                        >
                          {beneficiary.category.name}
                        </Badge>
                      </div>
                    </>
                  )}
                  {receiverName.trim() && (
                    <>
                      <div className="text-muted-foreground">المستلم نيابةً</div>
                      <div>{receiverName}</div>
                    </>
                  )}
                  {notes.trim() && (
                    <>
                      <div className="text-muted-foreground">ملاحظات</div>
                      <div>{notes}</div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && (
                    <LoaderCircle className="size-4 animate-spin" />
                  )}
                  تأكيد الاستلام
                </Button>
                <Button variant="outline" onClick={() => setStep("notes")}>
                  رجوع
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {step === "success" && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">تم الصرف بنجاح</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    تم تسجيل عملية الصرف وإنشاء إقرار الاستلام
                  </p>
                </div>
                <div className="flex gap-2">
                  {disbursementId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.open(
                          disbursementsApi.getAcknowledgmentUrl(
                            disbursementId
                          ),
                          "_blank"
                        )
                      }}
                    >
                      <FileText className="size-4" />
                      <span className="mr-2">عرض الإقرار</span>
                    </Button>
                  )}
                  <Button onClick={handleReset}>
                    <RotateCcw className="size-4" />
                    <span className="mr-2">توزيع جديد</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
