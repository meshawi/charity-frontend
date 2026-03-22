import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import * as beneficiariesApi from "@/lib/beneficiaries-api"
import type { Beneficiary, Pagination } from "@/types/beneficiaries"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
  LoaderCircle,
  Search,
  Eye,
  Tag,
  Undo2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Category } from "@/types/categories"
import * as categoriesApi from "@/lib/categories-api"

export default function ReviewQueuePage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const canReview = auth.hasPermission("assign_category")

  const [beneficiaries, setBeneficiaries] = React.useState<Beneficiary[]>([])
  const [pagination, setPagination] = React.useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [returnTarget, setReturnTarget] = React.useState<Beneficiary | null>(null)
  const [approveTarget, setApproveTarget] = React.useState<Beneficiary | null>(null)
  const [categories, setCategories] = React.useState<Category[]>([])

  const loadData = React.useCallback(
    async (page = 1) => {
      if (!canReview) return
      setLoading(true)
      try {
        const [res, catRes] = await Promise.all([
          beneficiariesApi.getReviewQueue({
            page,
            limit: 20,
            search: search || undefined,
          }),
          categoriesApi.getCategories(),
        ])
        setBeneficiaries(res.beneficiaries)
        setPagination(res.pagination)
        setCategories(catRes.categories)
      } catch {
        toast.error("حدث خطأ في تحميل قائمة المراجعة")
      } finally {
        setLoading(false)
      }
    },
    [canReview, search]
  )

  React.useEffect(() => {
    loadData()
  }, [loadData])

  if (!canReview) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        ليس لديك صلاحية الوصول لهذه الصفحة
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-medium">قائمة المراجعة</h1>
        <Badge variant="secondary">{pagination.total} ملف منتظر</Badge>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو رقم الهوية..."
            className="ps-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadData(1)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => loadData(1)}>
          بحث
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم المستفيد</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>رقم الهوية</TableHead>
                  <TableHead>العمر</TableHead>
                  <TableHead>أنشئ بواسطة</TableHead>
                  <TableHead>التابعين</TableHead>
                  <TableHead>المستندات</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {beneficiaries.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-start font-medium">
                      {b.beneficiaryNumber}
                    </TableCell>
                    <TableCell>{b.name || "—"}</TableCell>
                    <TableCell className="text-start">
                      {b.nationalId}
                    </TableCell>
                    <TableCell>{b.age ?? "—"}</TableCell>
                    <TableCell>{b.createdBy.name}</TableCell>
                    <TableCell>{b.dependents?.length ?? 0}</TableCell>
                    <TableCell>{b.documents?.length ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => navigate(`/beneficiaries/${b.id}/view`)}
                          title="عرض الملف"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-green-600"
                          onClick={() => setApproveTarget(b)}
                          title="اعتماد (تعيين فئة)"
                        >
                          <Tag className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive"
                          onClick={() => setReturnTarget(b)}
                          title="إرجاع"
                        >
                          <Undo2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {beneficiaries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      لا توجد ملفات منتظرة للمراجعة
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={pagination.page <= 1}
                onClick={() => loadData(pagination.page - 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadData(pagination.page + 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <ReturnDialog
        beneficiary={returnTarget}
        onOpenChange={(open) => !open && setReturnTarget(null)}
        onSuccess={loadData}
      />

      <ApproveDialog
        beneficiary={approveTarget}
        categories={categories}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        onSuccess={loadData}
      />
    </div>
  )
}

function ReturnDialog({
  beneficiary,
  onOpenChange,
  onSuccess,
}: {
  beneficiary: Beneficiary | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [note, setNote] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (beneficiary) setNote("")
  }, [beneficiary])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!beneficiary || !note.trim()) return
    setSubmitting(true)
    try {
      await beneficiariesApi.returnBeneficiary(beneficiary.id, note.trim())
      toast.success("تم إرجاع الملف للباحث")
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ غير متوقع")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={!!beneficiary} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إرجاع الملف</DialogTitle>
          <DialogDescription>
            إرجاع ملف &quot;{beneficiary?.name || beneficiary?.beneficiaryNumber}&quot; للباحث
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="return-note">ملاحظة الإرجاع (إلزامي)</Label>
            <Textarea
              id="return-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="يرجى إكمال بيانات السكن وإرفاق صك الإعالة..."
              required
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting || !note.trim()}>
              {submitting && <LoaderCircle className="animate-spin" />}
              إرجاع
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ApproveDialog({
  beneficiary,
  categories,
  onOpenChange,
  onSuccess,
}: {
  beneficiary: Beneficiary | null
  categories: Category[]
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [categoryId, setCategoryId] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (beneficiary) {
      setCategoryId("")
      setNotes("")
    }
  }, [beneficiary])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!beneficiary || !categoryId) return
    setSubmitting(true)
    try {
      await beneficiariesApi.assignCategory(beneficiary.id, {
        categoryId: Number(categoryId),
        note: notes.trim() || "اعتماد",
      })
      toast.success("تم اعتماد الملف وتعيين الفئة")
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ غير متوقع")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={!!beneficiary} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>اعتماد الملف</DialogTitle>
          <DialogDescription>
            اعتماد ملف &quot;{beneficiary?.name || beneficiary?.beneficiaryNumber}&quot; وتعيين الفئة
          </DialogDescription>
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
            <Label htmlFor="approve-notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="approve-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting || !categoryId}>
              {submitting && <LoaderCircle className="animate-spin" />}
              اعتماد
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
