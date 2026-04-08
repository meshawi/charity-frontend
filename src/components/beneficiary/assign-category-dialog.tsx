import * as React from "react"
import * as beneficiariesApi from "@/lib/beneficiaries-api"
import type { Category } from "@/types/categories"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

export function AssignCategoryDialog({
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
