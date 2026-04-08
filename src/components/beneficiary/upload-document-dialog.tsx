import * as React from "react"
import * as beneficiariesApi from "@/lib/beneficiaries-api"
import type { DocumentType } from "@/types/beneficiaries"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { LoaderCircle } from "lucide-react"

export function UploadDocumentDialog({
  beneficiaryId,
  documentTypes,
  open,
  onOpenChange,
  onSuccess,
}: {
  beneficiaryId: number
  documentTypes: DocumentType[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [file, setFile] = React.useState<File | null>(null)
  const [docType, setDocType] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      setFile(null)
      setDocType("")
      setNotes("")
      if (fileRef.current) fileRef.current.value = ""
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !docType) return
    setSubmitting(true)
    try {
      await beneficiariesApi.uploadDocument(
        beneficiaryId,
        file,
        docType,
        notes || undefined
      )
      toast.success("تم رفع المستند بنجاح")
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ في رفع المستند")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>رفع مستند</DialogTitle>
          <DialogDescription>
            ارفع مستند جديد (PDF أو صور فقط، الحد الأقصى 10 ميجابايت)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>نوع المستند</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المستند" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>الملف</Label>
            <Input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-notes">ملاحظات (اختياري)</Label>
            <Input
              id="doc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting || !file || !docType}>
              {submitting && <LoaderCircle className="animate-spin" />}
              رفع
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
