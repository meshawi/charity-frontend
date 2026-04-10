import * as React from "react"
import SignaturePad from "signature_pad"
import { useAuth } from "@/contexts/auth-context"
import * as pledgesApi from "@/lib/pledges-api"
import type { PledgeBeneficiary } from "@/types/pledges"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  LoaderCircle,
  Search,
  CheckCircle2,
  RotateCcw,
  FileText,
  Eraser,
  AlertCircle,
} from "lucide-react"

type Step = "search" | "already-signed" | "sign" | "success"

export default function PledgeProcessPage() {
  const auth = useAuth()
  const canProcess = auth.hasPermission("process_pledge")

  const [searchQuery, setSearchQuery] = React.useState("")
  const [searching, setSearching] = React.useState(false)

  const [step, setStep] = React.useState<Step>("search")
  const [beneficiary, setBeneficiary] =
    React.useState<PledgeBeneficiary | null>(null)
  const [pledgeText, setPledgeText] = React.useState("")
  const [existingPledgeId, setExistingPledgeId] = React.useState<number | null>(
    null
  )

  const [submitting, setSubmitting] = React.useState(false)
  const [newPledgeId, setNewPledgeId] = React.useState<number | null>(null)

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const signaturePadRef = React.useRef<SignaturePad | null>(null)

  // Initialize signature pad when step becomes "sign"
  React.useEffect(() => {
    if (step !== "sign") return
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

  async function handleLookup() {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await pledgesApi.lookup(searchQuery.trim())
      if (!res.found || !res.beneficiary) {
        toast.error(res.message || "المستفيد غير موجود")
        return
      }
      setBeneficiary(res.beneficiary)
      if (res.alreadySigned && res.pledge) {
        setExistingPledgeId(res.pledge.id)
        setStep("already-signed")
      } else {
        setPledgeText(res.pledgeText ?? "")
        setStep("sign")
      }
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    } finally {
      setSearching(false)
    }
  }

  async function handleSign() {
    if (!beneficiary) return
    if (signaturePadRef.current?.isEmpty()) {
      toast.error("الرجاء التوقيع قبل المتابعة")
      return
    }
    const signature = signaturePadRef.current!.toDataURL("image/png")

    setSubmitting(true)
    try {
      const res = await pledgesApi.createPledge({
        beneficiaryId: beneficiary.id,
        signature,
      })
      setNewPledgeId(res.pledge.id)
      setStep("success")
      toast.success("تم توقيع الإقرار بنجاح")
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          toast.error("المستفيد وقّع الإقرار مسبقاً")
        } else {
          toast.error(err.message)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setStep("search")
    setSearchQuery("")
    setBeneficiary(null)
    setPledgeText("")
    setExistingPledgeId(null)
    setNewPledgeId(null)
    signaturePadRef.current = null
  }

  function clearSignature() {
    signaturePadRef.current?.clear()
  }

  if (!canProcess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">لا تملك صلاحية معالجة الإقرارات</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-medium">إقرار وتعهد</h1>
        <p className="text-sm text-muted-foreground">
          توقيع الإقرار والتعهد للمستفيدين
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Step 1: Search */}
        {step === "search" && (
          <Card>
            <CardHeader>
              <CardTitle>بحث عن مستفيد</CardTitle>
              <CardDescription>
                أدخل رقم الهوية أو رقم المستفيد
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>رقم الهوية أو رقم المستفيد</Label>
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="أدخل رقم الهوية أو رقم المستفيد"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLookup()
                    }}
                  />
                  <Button
                    onClick={handleLookup}
                    disabled={!searchQuery.trim() || searching}
                  >
                    {searching ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4" />
                    )}
                    <span className="mr-2">بحث</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Already signed */}
        {step === "already-signed" && beneficiary && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <AlertCircle className="size-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">تم التوقيع مسبقاً</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    المستفيد وقّع الإقرار مسبقاً
                  </p>
                </div>
                <div className="w-full rounded-lg border p-4 text-start">
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                    <div className="text-muted-foreground">الاسم</div>
                    <div className="font-medium">{beneficiary.name ?? "—"}</div>
                    <div className="text-muted-foreground">رقم المستفيد</div>
                    <div>{beneficiary.beneficiaryNumber}</div>
                    <div className="text-muted-foreground">رقم الهوية</div>
                    <div className="text-start">{beneficiary.nationalId}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {existingPledgeId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.open(
                          pledgesApi.getPdfUrl(existingPledgeId),
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
                    <span className="mr-2">بحث جديد</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sign step */}
        {step === "sign" && beneficiary && (
          <Card>
            <CardHeader>
              <CardTitle>توقيع الإقرار</CardTitle>
              <CardDescription>
                يرجى قراءة نص الإقرار ثم التوقيع في المربع أدناه
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Beneficiary info */}
              <div className="rounded-lg border p-4">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  <div className="text-muted-foreground">الاسم</div>
                  <div className="font-medium">{beneficiary.name ?? "—"}</div>
                  <div className="text-muted-foreground">رقم المستفيد</div>
                  <div>{beneficiary.beneficiaryNumber}</div>
                  <div className="text-muted-foreground">رقم الهوية</div>
                  <div className="text-start">{beneficiary.nationalId}</div>
                  <div className="text-muted-foreground">الهاتف</div>
                  <div className="text-start">{beneficiary.phone ?? "—"}</div>
                </div>
              </div>

              {/* Pledge text */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <h4 className="mb-2 text-sm font-medium">نص الإقرار والتعهد</h4>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {pledgeText}
                </p>
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
                <Button onClick={handleSign} disabled={submitting}>
                  {submitting && (
                    <LoaderCircle className="size-4 animate-spin" />
                  )}
                  توقيع
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  إلغاء
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
                  <h3 className="text-lg font-medium">تم التوقيع بنجاح</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    تم تسجيل الإقرار وإنشاء المستند
                  </p>
                </div>
                <div className="flex gap-2">
                  {newPledgeId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.open(
                          pledgesApi.getPdfUrl(newPledgeId),
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
                    <span className="mr-2">إقرار جديد</span>
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
