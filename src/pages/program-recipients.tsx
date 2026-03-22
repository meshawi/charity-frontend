import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import * as programsApi from "@/lib/programs-api"
import type {
  ProgramRecipientsFilterResponse,
  ProgramRecipientBeneficiary,
} from "@/types/disbursements"
import { ApiError } from "@/lib/api-client"
import { formatDate } from "@/lib/date-utils"
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
import { LoaderCircle, ArrowRight, Search, Eye } from "lucide-react"
import { getAcknowledgmentUrl } from "@/lib/disbursements-api"

type FilterType = "all" | "received" | "eligible"

const FILTER_LABELS: Record<FilterType, string> = {
  all: "الكل",
  received: "استلم",
  eligible: "لم يستلم",
}

export default function ProgramRecipientsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const programId = Number(id)

  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<FilterType>("all")
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [data, setData] =
    React.useState<ProgramRecipientsFilterResponse | null>(null)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await programsApi.getProgramBeneficiaries(programId, {
        status: filter === "all" ? undefined : filter,
        search: search || undefined,
        page,
        limit: 20,
      })
      setData(res)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "حدث خطأ في تحميل البيانات"
      )
    } finally {
      setLoading(false)
    }
  }, [programId, filter, search, page])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    loadData()
  }

  const summary = data?.summary
  const pagination = data?.pagination

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/programs")}
        >
          <ArrowRight />
        </Button>
        <h1 className="text-2xl font-bold">
          مستلموا البرنامج: {data?.programName || "..."}
        </h1>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-6 text-center">
            <div className="text-3xl font-bold">{summary.totalQualified}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              إجمالي المؤهلين
            </div>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950">
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">
              {summary.totalReceived}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">استلم</div>
          </div>
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 text-center dark:border-orange-900 dark:bg-orange-950">
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">
              {summary.totalEligible}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">لم يستلم</div>
          </div>
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex rounded-lg border p-1">
          {(Object.keys(FILTER_LABELS) as FilterType[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setFilter(f)
                setPage(1)
              }}
            >
              {FILTER_LABELS[f]}
            </Button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="بحث بالاسم أو رقم الهوية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <BeneficiariesTable
          beneficiaries={data?.beneficiaries ?? []}
          filter={filter}
        />
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {pagination.page} من {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  )
}

function BeneficiariesTable({
  beneficiaries,
  filter,
}: {
  beneficiaries: ProgramRecipientBeneficiary[]
  filter: FilterType
}) {
  const navigate = useNavigate()

  if (!beneficiaries.length) {
    return (
      <p className="py-8 text-center text-muted-foreground">لا توجد بيانات</p>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الرقم</TableHead>
            <TableHead>الاسم</TableHead>
            <TableHead>رقم الهوية</TableHead>
            <TableHead>الجوال</TableHead>
            <TableHead>الفئة</TableHead>
            {filter === "all" && <TableHead>الحالة</TableHead>}
            {filter === "received" && <TableHead>تاريخ الاستلام</TableHead>}
            {filter === "received" && <TableHead>سُلّم بواسطة</TableHead>}
            {filter === "received" && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {beneficiaries.map((b) => (
            <TableRow
              key={b.id}
              className="cursor-pointer"
              onClick={() => navigate(`/beneficiaries/${b.id}`)}
            >
              <TableCell className="font-mono">
                {b.beneficiaryNumber}
              </TableCell>
              <TableCell>{b.name || "—"}</TableCell>
              <TableCell className="font-mono">{b.nationalId}</TableCell>
              <TableCell>{b.phone || "—"}</TableCell>
              <TableCell>
                {b.category ? (
                  <Badge
                    variant="outline"
                    style={{ borderColor: b.category.color }}
                  >
                    {b.category.name}
                  </Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              {filter === "all" && (
                <TableCell>
                  {b.status === "received" ? (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      استلم
                    </Badge>
                  ) : (
                    <Badge variant="outline">لم يستلم</Badge>
                  )}
                </TableCell>
              )}
              {filter === "received" && (
                <TableCell>
                  {b.disbursement
                    ? formatDate(b.disbursement.disbursedAt)
                    : "—"}
                </TableCell>
              )}
              {filter === "received" && (
                <TableCell>
                  {b.disbursement?.disbursedBy?.name || "—"}
                </TableCell>
              )}
              {filter === "received" && (
                <TableCell>
                  {b.disbursement && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(
                          getAcknowledgmentUrl(b.disbursement!.id),
                          "_blank"
                        )
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
