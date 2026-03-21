import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import * as beneficiariesApi from "@/lib/beneficiaries-api"
import * as reportsApi from "@/lib/reports-api"
import type { BeneficiaryListItem, Pagination } from "@/types/beneficiaries"
import type { FilterField, ActiveFilter } from "@/types/reports"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FilterBuilder } from "@/components/filter-builder"
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
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Search,
  ChevronRight,
  ChevronLeft,
  Download,
} from "lucide-react"

const GENDER_LABELS: Record<string, string> = {
  male: "ذكر",
  female: "أنثى",
}

export default function BeneficiariesPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [beneficiaries, setBeneficiaries] = React.useState<
    BeneficiaryListItem[]
  >([])
  const [filterFields, setFilterFields] = React.useState<FilterField[]>([])
  const [filters, setFilters] = React.useState<ActiveFilter[]>([])
  const [pagination, setPagination] = React.useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [exporting, setExporting] = React.useState(false)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [deleteBeneficiary, setDeleteBeneficiary] =
    React.useState<BeneficiaryListItem | null>(null)

  const canCreate = auth.hasPermission("create_profile")
  const canEdit = auth.hasPermission("edit_profile")
  const canDelete = auth.hasPermission("delete_profile")
  const canExport = auth.hasPermission("view_reports")

  // Load filter fields once
  React.useEffect(() => {
    reportsApi.getFilterFields().then((res) => setFilterFields(res.fields)).catch(() => {})
  }, [])

  const loadData = React.useCallback(async () => {
    try {
      const res = await reportsApi.filterBeneficiaries({
        filters,
        search: search || undefined,
        page,
        limit: 20,
      })
      setBeneficiaries(res.beneficiaries)
      setPagination(res.pagination)
    } catch {
      toast.error("حدث خطأ في تحميل البيانات")
    } finally {
      setLoading(false)
    }
  }, [filters, search, page])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [search, filters])

  async function handleDelete() {
    if (!deleteBeneficiary) return
    try {
      await beneficiariesApi.deleteBeneficiary(deleteBeneficiary.id)
      toast.success("تم حذف المستفيد بنجاح")
      setDeleteBeneficiary(null)
      loadData()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "حدث خطأ غير متوقع"
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-medium">إدارة المستفيدين</h1>
        <div className="flex items-center gap-2">
          {canExport && (
            <Button
              variant="outline"
              size="sm"
              disabled={exporting}
              onClick={async () => {
                setExporting(true)
                try {
                  await reportsApi.exportBeneficiaries(filters)
                  toast.success("تم تصدير التقرير بنجاح")
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "حدث خطأ في التصدير")
                } finally {
                  setExporting(false)
                }
              }}
            >
              {exporting ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
              تصدير Excel
            </Button>
          )}
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              إضافة مستفيد
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم، رقم الهوية، رقم المستفيد، أو الهاتف..."
            className="ps-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {filterFields.length > 0 && (
          <FilterBuilder fields={filterFields} onChange={setFilters} />
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-28">رقم المستفيد</TableHead>
              <TableHead className="min-w-32">الاسم</TableHead>
              <TableHead className="min-w-24">رقم الهوية</TableHead>
              <TableHead>الجنس</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>التصنيف</TableHead>
              {(canEdit || canDelete) && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {beneficiaries.map((b) => (
              <TableRow
                key={b.id}
                className="cursor-pointer"
                onClick={() => navigate(`/beneficiaries/${b.id}`)}
              >
                <TableCell dir="ltr" className="text-start font-mono text-sm">
                  {b.beneficiaryNumber}
                </TableCell>
                <TableCell className="font-medium">
                  {b.name || "—"}
                </TableCell>
                <TableCell dir="ltr" className="text-start">
                  {b.nationalId}
                </TableCell>
                <TableCell>
                  {b.gender ? GENDER_LABELS[b.gender] : "—"}
                </TableCell>
                <TableCell dir="ltr" className="text-start">
                  {b.phone || "—"}
                </TableCell>
                <TableCell>
                  {b.category ? (
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: b.category.color,
                        color: b.category.color,
                      }}
                    >
                      {b.category.name}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/beneficiaries/${b.id}`)
                          }}
                        >
                          <Eye className="size-4" />
                          عرض
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/beneficiaries/${b.id}`)
                            }}
                          >
                            <Pencil className="size-4" />
                            تعديل
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteBeneficiary(b)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="size-4" />
                            حذف
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {beneficiaries.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canEdit || canDelete ? 7 : 6}
                  className="text-center text-muted-foreground"
                >
                  لا يوجد مستفيدين
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            عرض {beneficiaries.length} من {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronRight className="size-4" />
              السابق
            </Button>
            <span className="text-sm text-muted-foreground">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <CreateBeneficiaryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={loadData}
      />

      <AlertDialog
        open={!!deleteBeneficiary}
        onOpenChange={(open) => !open && setDeleteBeneficiary(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المستفيد</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المستفيد &quot;
              {deleteBeneficiary?.name || deleteBeneficiary?.beneficiaryNumber}
              &quot;؟ سيتم حذف جميع البيانات المرتبطة. لا يمكن التراجع عن هذا
              الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CreateBeneficiaryDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [nationalId, setNationalId] = React.useState("")
  const [name, setName] = React.useState("")
  const [gender, setGender] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setNationalId("")
      setName("")
      setGender("")
      setPhone("")
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await beneficiariesApi.createBeneficiary({
        nationalId,
        name: name || undefined,
        gender: gender as "male" | "female" | undefined,
        phone: phone || undefined,
      })
      toast.success("تم إنشاء المستفيد بنجاح")
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "حدث خطأ غير متوقع"
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة مستفيد جديد</DialogTitle>
          <DialogDescription>
            أدخل رقم الهوية لإنشاء ملف مستفيد جديد
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b-nid">رقم الهوية</Label>
            <Input
              id="b-nid"
              dir="ltr"
              className="text-start"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              required
              maxLength={10}
              pattern="\d{10}"
              title="رقم الهوية يجب أن يكون 10 أرقام"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b-name">الاسم (اختياري)</Label>
            <Input
              id="b-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>الجنس</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الجنس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">ذكر</SelectItem>
                <SelectItem value="female">أنثى</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b-phone">الهاتف (اختياري)</Label>
            <Input
              id="b-phone"
              dir="ltr"
              className="text-start"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              إنشاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
