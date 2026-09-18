import * as React from "react"
import { useAuth } from "@/contexts/auth-context"
import * as schoolsApi from "@/lib/schools-api"
import type { School, UnlistedSchool } from "@/types/schools"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertTriangle,
  Download,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"

export default function SchoolsPage() {
  const auth = useAuth()
  const [schools, setSchools] = React.useState<School[]>([])
  const [unlisted, setUnlisted] = React.useState<UnlistedSchool[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editSchool, setEditSchool] = React.useState<School | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<School | null>(null)
  const [importing, setImporting] = React.useState(false)

  const canManage = auth.hasPermission("manage_field_config")

  const loadData = React.useCallback(async () => {
    try {
      const res = await schoolsApi.getSchools()
      setSchools(res.schools)
      setUnlisted(res.unlisted)
    } catch {
      toast.error("حدث خطأ في تحميل المدارس")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  async function handleImport() {
    setImporting(true)
    try {
      const res = await schoolsApi.importUnlistedSchools()
      toast.success(res.message)
      loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ غير متوقع")
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const term = search.trim()
  const visibleSchools = term ? schools.filter((s) => s.name.includes(term)) : schools
  const unlistedDependents = unlisted.reduce((sum, u) => sum + u.dependentsCount, 0)

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-medium">إدارة المدارس</h1>
          <p className="text-sm text-muted-foreground">
            قائمة المدارس التي تظهر عند تعبئة بيانات التابعين
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            إضافة مدرسة
          </Button>
        )}
      </div>

      {unlisted.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-sm">
                <p className="font-medium">
                  {unlisted.length} اسم مدرسة مسجل لدى {unlistedDependents} تابع وغير موجود في القائمة
                </p>
                <p className="text-muted-foreground">
                  هذه أسماء كُتبت يدوياً قبل اعتماد القائمة. بيانات التابعين محفوظة كما هي، ويمكنك
                  استيرادها إلى القائمة ثم دمج المكرر منها عن طريق الحذف مع النقل.
                </p>
              </div>
            </div>
            {canManage && (
              <Button size="sm" variant="outline" onClick={handleImport} disabled={importing}>
                {importing ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
                استيراد الكل إلى القائمة
              </Button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {unlisted.map((u) => (
              <Badge key={u.name} variant="outline">
                {u.name} ({u.dependentsCount})
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Input
        className="mb-3 max-w-xs"
        placeholder="بحث باسم المدرسة"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم المدرسة</TableHead>
              <TableHead>عدد التابعين</TableHead>
              {canManage && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleSchools.map((school) => (
              <TableRow key={school.id}>
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{school.dependentsCount}</Badge>
                </TableCell>
                {canManage && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditSchool(school)}>
                          <Pencil className="size-4" />
                          تعديل الاسم
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(school)}
                        >
                          <Trash2 className="size-4" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {visibleSchools.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 3 : 2}
                  className="text-center text-muted-foreground"
                >
                  {term ? "لا توجد نتائج" : "لا توجد مدارس في القائمة"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SchoolFormDialog
        open={createOpen}
        onOpenChange={(open) => !open && setCreateOpen(false)}
        onSuccess={loadData}
      />

      <SchoolFormDialog
        school={editSchool}
        open={!!editSchool}
        onOpenChange={(open) => !open && setEditSchool(null)}
        onSuccess={loadData}
      />

      <DeleteSchoolDialog
        school={deleteTarget}
        otherSchools={schools.filter((s) => s.id !== deleteTarget?.id)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onSuccess={loadData}
      />
    </div>
  )
}

function SchoolFormDialog({
  school,
  open,
  onOpenChange,
  onSuccess,
}: {
  school?: School | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const isCreate = !school
  const [name, setName] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    setName(school?.name ?? "")
  }, [school, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      if (isCreate) {
        await schoolsApi.createSchool(name.trim())
        toast.success("تمت إضافة المدرسة بنجاح")
      } else {
        await schoolsApi.updateSchool(school.id, name.trim())
        toast.success("تم تحديث اسم المدرسة بنجاح")
      }
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? "إضافة مدرسة" : "تعديل اسم المدرسة"}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "ستظهر المدرسة في قائمة الاختيار عند تعبئة بيانات التابعين"
              : school && school.dependentsCount > 0
                ? `سيتم تحديث الاسم لدى ${school.dependentsCount} تابع مرتبط بهذه المدرسة`
                : "لا يوجد تابعين مرتبطين بهذه المدرسة"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="school-name">اسم المدرسة</Label>
            <Input
              id="school-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting && <LoaderCircle className="animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteSchoolDialog({
  school,
  otherSchools,
  onOpenChange,
  onSuccess,
}: {
  school: School | null
  otherSchools: School[]
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [mode, setMode] = React.useState<"transfer" | "keep" | "">("")
  const [transferToId, setTransferToId] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (school) {
      setMode("")
      setTransferToId("")
    }
  }, [school])

  const inUse = !!school && school.dependentsCount > 0
  const canSubmit = !inUse || mode === "keep" || (mode === "transfer" && !!transferToId)

  async function handleDelete() {
    if (!school || !canSubmit) return
    setSubmitting(true)
    try {
      await schoolsApi.deleteSchool(
        school.id,
        !inUse
          ? undefined
          : mode === "transfer"
            ? { mode: "transfer", transferToId: Number(transferToId) }
            : { mode: "keep" }
      )
      toast.success("تم حذف المدرسة بنجاح")
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ غير متوقع")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={!!school} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>حذف مدرسة</DialogTitle>
          <DialogDescription>
            {inUse
              ? `المدرسة «${school?.name}» مرتبطة بـ ${school?.dependentsCount} تابع. اختر ما يحدث لبياناتهم:`
              : `هل أنت متأكد من حذف المدرسة «${school?.name}»؟ لا يوجد تابعين مرتبطين بها.`}
          </DialogDescription>
        </DialogHeader>

        {inUse && (
          <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 has-checked:border-primary">
              <input
                type="radio"
                name="delete-mode"
                className="mt-1"
                checked={mode === "transfer"}
                onChange={() => setMode("transfer")}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-sm font-medium">نقلهم إلى مدرسة أخرى</span>
                <span className="text-xs text-muted-foreground">
                  مناسب لدمج مدرسة مكررة أو مكتوبة بصيغة مختلفة
                </span>
                {mode === "transfer" && (
                  <Select value={transferToId} onValueChange={setTransferToId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر المدرسة" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherSchools.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 has-checked:border-primary">
              <input
                type="radio"
                name="delete-mode"
                className="mt-1"
                checked={mode === "keep"}
                onChange={() => setMode("keep")}
              />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">إبقاء اسم المدرسة في ملفاتهم</span>
                <span className="text-xs text-muted-foreground">
                  تُحذف المدرسة من القائمة فقط، ويبقى اسمها ظاهراً لدى التابعين الحاليين
                </span>
              </div>
            </label>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={submitting || !canSubmit}
            onClick={handleDelete}
          >
            {submitting && <LoaderCircle className="animate-spin" />}
            حذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
