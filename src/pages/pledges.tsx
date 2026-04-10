import * as React from "react"
import { useAuth } from "@/contexts/auth-context"
import * as pledgesApi from "@/lib/pledges-api"
import type { PledgeListItem, Pagination } from "@/types/pledges"
import { ApiError } from "@/lib/api-client"
import { formatDateTime } from "@/lib/date-utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  FileDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"

export default function PledgesPage() {
  const auth = useAuth()
  const canView = auth.hasPermission("view_pledges")

  const [pledges, setPledges] = React.useState<PledgeListItem[]>([])
  const [pagination, setPagination] = React.useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)

  const loadData = React.useCallback(async () => {
    try {
      const res = await pledgesApi.getPledges({
        search: search || undefined,
        page,
        limit: 20,
      })
      setPledges(res.pledges)
      setPagination(res.pagination)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, page])

  React.useEffect(() => {
    if (!canView) return
    loadData()
  }, [loadData, canView])

  React.useEffect(() => {
    setPage(1)
  }, [search])

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">لا تملك صلاحية عرض الإقرارات</p>
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
        <h1 className="text-lg font-medium">سجل الإقرارات</h1>
        <p className="text-sm text-muted-foreground">
          عرض جميع الإقرارات والتعهدات الموقعة
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو رقم الهوية أو رقم المستفيد..."
            className="ps-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المستفيد</TableHead>
              <TableHead>رقم الهوية</TableHead>
              <TableHead>تاريخ التوقيع</TableHead>
              <TableHead>الموظف</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pledges.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  لا توجد إقرارات
                </TableCell>
              </TableRow>
            ) : (
              pledges.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {p.beneficiary.name ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.beneficiary.beneficiaryNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell dir="ltr" className="text-start">
                    {p.beneficiary.nationalId}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDateTime(p.signedAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.processedBy.name}
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
                            window.open(
                              pledgesApi.getPdfUrl(p.id),
                              "_blank"
                            )
                          }}
                        >
                          <FileDown className="size-4" />
                          تحميل الإقرار
                        </DropdownMenuItem>
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
            إجمالي {pagination.total} إقرار — صفحة {pagination.page} من{" "}
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
    </div>
  )
}
