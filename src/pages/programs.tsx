import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import * as programsApi from "@/lib/programs-api"
import * as categoriesApi from "@/lib/categories-api"
import type { Program } from "@/types/programs"
import type { Category } from "@/types/categories"
import { ApiError } from "@/lib/api-client"
import { formatDate } from "@/lib/date-utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  Users,
} from "lucide-react"

export default function ProgramsPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [programs, setPrograms] = React.useState<Program[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editProgram, setEditProgram] = React.useState<Program | null>(null)
  const [deleteProgram, setDeleteProgram] = React.useState<Program | null>(null)

  const canManage = auth.hasPermission("manage_programs")
  const canViewProfiles = auth.hasPermission("view_profiles")
  const showActions = canManage || canViewProfiles

  const loadData = React.useCallback(async () => {
    try {
      const [programsRes, categoriesRes] = await Promise.all([
        programsApi.getPrograms().catch((err) => {
          if (err instanceof ApiError && err.status === 403) return { programs: [] as Program[] }
          throw err
        }),
        categoriesApi.getCategories(),
      ])
      setPrograms(programsRes.programs)
      setCategories(categoriesRes.categories)
    } catch {
      toast.error("حدث خطأ في تحميل البيانات")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  async function handleDelete() {
    if (!deleteProgram) return
    try {
      await programsApi.deleteProgram(deleteProgram.id)
      toast.success("تم حذف البرنامج بنجاح")
      setDeleteProgram(null)
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
        <h1 className="text-lg font-medium">إدارة البرامج</h1>
        {canManage && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            إضافة برنامج
          </Button>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-32">الاسم</TableHead>
              <TableHead className="min-w-48">الوصف</TableHead>
              <TableHead className="min-w-32">التصنيفات</TableHead>
              <TableHead className="min-w-28">تاريخ البدء</TableHead>
              <TableHead className="min-w-28">تاريخ الانتهاء</TableHead>
              <TableHead className="min-w-20">الحالة</TableHead>
              {showActions && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow
                key={program.id}
                className="cursor-pointer"
                onClick={() => navigate(`/programs/${program.id}/recipients`)}
              >
                <TableCell className="font-medium">{program.name}</TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {program.description || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {program.categories.map((cat) => (
                      <Badge
                        key={cat.id}
                        variant="outline"
                        style={{
                          borderColor: cat.color,
                          color: cat.color,
                        }}
                      >
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDate(program.startDate)}
                </TableCell>
                <TableCell>
                  {formatDate(program.endDate)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={program.isActive ? "default" : "destructive"}
                  >
                    {program.isActive ? "نشط" : "غير نشط"}
                  </Badge>
                </TableCell>
                {showActions && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canViewProfiles && (
                          <DropdownMenuItem
                            onClick={() => navigate(`/programs/${program.id}/recipients`)}
                          >
                            <Users className="size-4" />
                            المستلمين
                          </DropdownMenuItem>
                        )}
                        {canManage && (
                          <DropdownMenuItem
                            onClick={() => setEditProgram(program)}
                          >
                            <Pencil className="size-4" />
                            تعديل
                          </DropdownMenuItem>
                        )}
                        {canManage && (
                          <DropdownMenuItem
                            onClick={() => setDeleteProgram(program)}
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
            {programs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 7 : 6}
                  className="text-center text-muted-foreground"
                >
                  لا يوجد برامج
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProgramFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
        onSuccess={loadData}
      />

      <ProgramFormDialog
        program={editProgram}
        open={!!editProgram}
        onOpenChange={(open) => !open && setEditProgram(null)}
        categories={categories}
        onSuccess={loadData}
      />

      <AlertDialog
        open={!!deleteProgram}
        onOpenChange={(open) => !open && setDeleteProgram(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف البرنامج</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف البرنامج &quot;{deleteProgram?.name}&quot;؟
              لا يمكن التراجع عن هذا الإجراء.
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

function ProgramFormDialog({
  program,
  open,
  onOpenChange,
  categories,
  onSuccess,
}: {
  program?: Program | null
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  onSuccess: () => void
}) {
  const isEdit = !!program
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [selectedCategories, setSelectedCategories] = React.useState<number[]>(
    []
  )
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (program) {
      setName(program.name)
      setDescription(program.description || "")
      setSelectedCategories(program.categories.map((c) => c.id))
      setStartDate(program.startDate || "")
      setEndDate(program.endDate || "")
      setIsActive(program.isActive)
    } else {
      setName("")
      setDescription("")
      setSelectedCategories([])
      setStartDate("")
      setEndDate("")
      setIsActive(true)
    }
  }, [program, open])

  function toggleCategory(id: number) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedCategories.length === 0) {
      toast.error("يجب اختيار تصنيف واحد على الأقل")
      return
    }
    setSubmitting(true)
    try {
      if (isEdit && program) {
        await programsApi.updateProgram(program.id, {
          name,
          description: description || undefined,
          categoryIds: selectedCategories,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          isActive,
        })
        toast.success("تم تحديث البرنامج بنجاح")
      } else {
        await programsApi.createProgram({
          name,
          description: description || undefined,
          categoryIds: selectedCategories,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        })
        toast.success("تم إنشاء البرنامج بنجاح")
      }
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
          <DialogTitle>
            {isEdit ? "تعديل البرنامج" : "إضافة برنامج جديد"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `تعديل بيانات ${program?.name}`
              : "قم بتعبئة البيانات لإنشاء برنامج جديد"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prog-name">الاسم</Label>
            <Input
              id="prog-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prog-desc">الوصف (اختياري)</Label>
            <Textarea
              id="prog-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>التصنيفات</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant={
                    selectedCategories.includes(cat.id) ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  style={
                    selectedCategories.includes(cat.id)
                      ? { backgroundColor: cat.color, borderColor: cat.color }
                      : { borderColor: cat.color, color: cat.color }
                  }
                  onClick={() => toggleCategory(cat.id)}
                >
                  {cat.name}
                </Badge>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  لا يوجد تصنيفات. قم بإنشاء تصنيف أولاً.
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prog-start">تاريخ البدء</Label>
              <Input
                id="prog-start"
                type="date"
                dir="ltr"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prog-end">تاريخ الانتهاء</Label>
              <Input
                id="prog-end"
                type="date"
                dir="ltr"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          {isEdit && (
            <div className="flex items-center gap-2">
              <Switch
                id="prog-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="prog-active">نشط</Label>
            </div>
          )}
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
              {isEdit ? "حفظ" : "إنشاء"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
