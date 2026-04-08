import * as React from "react"
import * as beneficiariesApi from "@/lib/beneficiaries-api"
import type { CategoryHistoryEntry } from "@/types/beneficiaries"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/date-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoaderCircle } from "lucide-react"

export function CategoryHistoryDialog({
  beneficiaryId,
  open,
  onOpenChange,
}: {
  beneficiaryId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [history, setHistory] = React.useState<CategoryHistoryEntry[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setLoading(true)
    beneficiariesApi
      .getCategoryHistory(beneficiaryId)
      .then((res) => setHistory(res.history))
      .catch((err) => {
        if (err instanceof ApiError) toast.error(err.message)
      })
      .finally(() => setLoading(false))
  }, [open, beneficiaryId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>سجل تغيير الفئة</DialogTitle>
          <DialogDescription>جميع التغييرات على فئة المستفيد</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-6">
            <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            لا يوجد سجل تغييرات
          </p>
        ) : (
          <div className="max-h-[50vh] space-y-3 overflow-y-auto">
            {history.map((entry) => (
              <div key={entry.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm">
                  {entry.previousCategory ? (
                    <>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: entry.previousCategory.color,
                          color: entry.previousCategory.color,
                        }}
                      >
                        {entry.previousCategory.name}
                      </Badge>
                      <span className="text-muted-foreground">←</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">بدون فئة ←</span>
                  )}
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: entry.category.color,
                      color: entry.category.color,
                    }}
                  >
                    {entry.category.name}
                  </Badge>
                </div>
                <p className="mt-1 text-sm">{entry.note}</p>
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                  <span>بواسطة: {entry.assignedBy.name}</span>
                  <span>
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
