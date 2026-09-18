import * as React from "react"
import * as beneficiariesApi from "@/lib/beneficiaries-api"
import type { DocumentType } from "@/types/beneficiaries"
import { ApiError } from "@/lib/api-client"
import { OTHER_DOCUMENT_TYPE } from "@/lib/beneficiary-constants"
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
  existingTypes,
  open,
  onOpenChange,
  onSuccess,
}: {
  beneficiaryId: number
  documentTypes: DocumentType[]
  /** Types of the documents already on this file */
  existingTypes: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [file, setFile] = React.useState<File | null>(null)
  const [docType, setDocType] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const isOther = docType === OTHER_DOCUMENT_TYPE
  const canSubmit = !!file && !!docType && (!isOther || !!title.trim())
  // Fixed types hold one document each — a second upload replaces the first
  const willReplace = !isOther && existingTypes.includes(docType)

  React.useEffect(() => {
    if (open) {
      setFile(null)
      setDocType("")
      setTitle("")
      setNotes("")
      if (fileRef.current) fileRef.current.value = ""
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !canSubmit) return
    setSubmitting(true)
    try {
      await beneficiariesApi.uploadDocument(beneficiaryId, file, docType, {
        title: isOther ? title.trim() : undefined,
        notes: notes.trim() || undefined,
      })
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
            {willReplace && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                يوجد مستند سابق من هذا النوع وسيتم استبداله. لإضافة مستند إضافي اختر «أخرى».
              </span>
            )}
          </div>
          {isOther && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="doc-title">عنوان المستند</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: عقد إيجار، نسخة إضافية من الهوية"
                maxLength={150}
                autoFocus
                required
              />
            </div>
          )}
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
            <Button type="submit" disabled={submitting || !canSubmit}>
              {submitting && <LoaderCircle className="animate-spin" />}
              رفع
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
