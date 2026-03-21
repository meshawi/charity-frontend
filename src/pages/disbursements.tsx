import * as React from "react"
import { useAuth } from "@/contexts/auth-context"
import * as disbursementsApi from "@/lib/disbursements-api"
import type {
  DisbursementListItem,
  Pagination,
  ActiveProgram,
} from "@/types/disbursements"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LoaderCircle,
  Search,
  MoreHorizontal,
  Eye,
  FileDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"

export default function DisbursementsPage() {
  const auth = useAuth()
  const canView = auth.hasPermission("view_disbursements")

  const [disbursements, setDisbursements] = React.useState<
    DisbursementListItem[]
  >([])
  const [programs, setPrograms] = React.useState<ActiveProgram[]>([])
  const [pagination, setPagination] = React.useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [programFilter, setProgramFilter] = React.useState<string>("")
  const [page, setPage] = React.useState(1)

  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedDisbursement, setSelectedDisbursement] =
    React.useState<DisbursementListItem | null>(null)

  const loadData = React.useCallback(async () => {
    try {
      const [disbursementsRes, programsRes] = await Promise.all([
        disbursementsApi.getDisbursements({
          search: search || undefined,
          programId:
            programFilter && programFilter !== "all"
              ? Number(programFilter)
              : undefined,
          page,
          limit: 20,
        }),
        disbursementsApi.getActivePrograms(),
      ])
      setDisbursements(disbursementsRes.disbursements)
      setPagination(disbursementsRes.pagination)
      setPrograms(programsRes.programs)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, programFilter, page])

  React.useEffect(() => {
    if (!canView) return
    loadData()
  }, [loadData, canView])

  React.useEffect(() => {
    setPage(1)
  }, [search, programFilter])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">
          لا تملك صلاحية عرض سجل التوزيع
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-medium">سجل التوزيع</h1>
        <p className="text-sm text-muted-foreground">
          عرض جميع عمليات الصرف
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو رقم الهوية أو رقم المستفيد..."
            className="ps-9"
          />
        </div>
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="جميع البرامج" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع البرامج</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المستفيد</TableHead>
              <TableHead>رقم الهوية</TableHead>
              <TableHead>البرنامج</TableHead>
              <TableHead>تاريخ الصرف</TableHead>
              <TableHead>الموظف</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {disbursements.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  لا توجد عمليات صرف
                </TableCell>
              </TableRow>
            ) : (
              disbursements.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {d.beneficiary.name ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {d.beneficiary.beneficiaryNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell dir="ltr" className="text-start">
                    {d.beneficiary.nationalId}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{d.program.name}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(d.disbursedAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {d.disbursedBy.name}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedDisbursement(d)
                            setDetailOpen(true)
                          }}
                        >
                          <Eye className="size-4" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        {d.acknowledgmentFile && (
                          <DropdownMenuItem
                            onClick={() => {
                              window.open(
                                disbursementsApi.getAcknowledgmentUrl(d.id),
                                "_blank"
                              )
                            }}
                          >
                            <FileDown className="size-4" />
                            تحميل الإقرار
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            إجمالي {pagination.total} عملية — صفحة {pagination.page} من{" "}
            {pagination.totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <DisbursementDetailDialog
        disbursement={selectedDisbursement}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setSelectedDisbursement(null)
        }}
      />
    </div>
  )
}

function DisbursementDetailDialog({
  disbursement,
  open,
  onOpenChange,
}: {
  disbursement: DisbursementListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!disbursement) return null

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تفاصيل عملية الصرف</DialogTitle>
          <DialogDescription>
            عملية صرف رقم {disbursement.id}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 text-sm font-medium">معلومات المستفيد</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">الاسم</div>
              <div>{disbursement.beneficiary.name ?? "—"}</div>
              <div className="text-muted-foreground">رقم المستفيد</div>
              <div>{disbursement.beneficiary.beneficiaryNumber}</div>
              <div className="text-muted-foreground">رقم الهوية</div>
              <div dir="ltr" className="text-start">
                {disbursement.beneficiary.nationalId}
              </div>
              {disbursement.beneficiary.category && (
                <>
                  <div className="text-muted-foreground">التصنيف</div>
                  <div>
                    <Badge variant="secondary">
                      {disbursement.beneficiary.category.name}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="mb-3 text-sm font-medium">معلومات الصرف</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">البرنامج</div>
              <div>{disbursement.program.name}</div>
              <div className="text-muted-foreground">تاريخ الصرف</div>
              <div>{formatDate(disbursement.disbursedAt)}</div>
              <div className="text-muted-foreground">الموظف</div>
              <div>{disbursement.disbursedBy.name}</div>
              {disbursement.receiverName && (
                <>
                  <div className="text-muted-foreground">المستلم</div>
                  <div>{disbursement.receiverName}</div>
                </>
              )}
              {disbursement.notes && (
                <>
                  <div className="text-muted-foreground">ملاحظات</div>
                  <div>{disbursement.notes}</div>
                </>
              )}
            </div>
          </div>

          {disbursement.acknowledgmentFile && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                window.open(
                  disbursementsApi.getAcknowledgmentUrl(disbursement.id),
                  "_blank"
                )
              }}
            >
              <FileDown className="size-4" />
              <span className="mr-2">تحميل إقرار الاستلام</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
