import * as React from "react"
import { useAuth } from "@/contexts/auth-context"
import * as categoriesApi from "@/lib/categories-api"
import type { Category } from "@/types/categories"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoaderCircle, MoreHorizontal, Pencil } from "lucide-react"

export default function CategoriesPage() {
  const auth = useAuth()
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)

  const [editCategory, setEditCategory] = React.useState<Category | null>(null)

  const canManage = auth.hasPermission("manage_categories")

  const loadData = React.useCallback(async () => {
    try {
      const res = await categoriesApi.getCategories()
      setCategories(res.categories)
    } catch {
      toast.error("حدث خطأ في تحميل التصنيفات")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

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
        <h1 className="text-lg font-medium">إدارة التصنيفات</h1>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اللون</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الوصف</TableHead>
              <TableHead>البرامج</TableHead>
              {canManage && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                  <div
                    className="size-6 rounded-md border"
                    style={{ backgroundColor: cat.color }}
                  />
                </TableCell>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {cat.description || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{cat.programCount ?? 0}</Badge>
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
                        <DropdownMenuItem
                          onClick={() => setEditCategory(cat)}
                        >
                          <Pencil className="size-4" />
                          تعديل
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 5 : 4}
                  className="text-center text-muted-foreground"
                >
                  لا يوجد تصنيفات
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryFormDialog
        category={editCategory}
        open={!!editCategory}
        onOpenChange={(open) => !open && setEditCategory(null)}
        onSuccess={loadData}
      />
    </div>
  )
}

function CategoryFormDialog({
  category,
  open,
  onOpenChange,
  onSuccess,
}: {
  category?: Category | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [description, setDescription] = React.useState("")
  const [color, setColor] = React.useState("#3b82f6")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (category) {
      setDescription(category.description || "")
      setColor(category.color)
    } else {
      setDescription("")
      setColor("#3b82f6")
    }
  }, [category, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) return
    setSubmitting(true)
    try {
      await categoriesApi.updateCategory(category.id, {
        description: description || undefined,
        color,
      })
      toast.success("تم تحديث التصنيف بنجاح")
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
          <DialogTitle>تعديل التصنيف</DialogTitle>
          <DialogDescription>
            تعديل بيانات {category?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">الاسم</Label>
            <Input
              id="cat-name"
              value={category?.name ?? ""}
              disabled
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-desc">الوصف (اختياري)</Label>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-color">اللون</Label>
            <div className="flex items-center gap-2">
              <input
                id="cat-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-8 cursor-pointer rounded border"
              />
              <Input
                dir="ltr"
                className="w-28 text-left"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
              />
            </div>
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
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
