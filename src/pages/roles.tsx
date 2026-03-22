import * as React from "react"
import { useAuth } from "@/contexts/auth-context"
import * as rolesApi from "@/lib/roles-api"
import type { RoleWithPermissions, PermissionItem } from "@/lib/roles-api"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  ShieldCheck,
} from "lucide-react"

const SUPER_ADMIN_ROLE_NAME = "مدير النظام"

export default function RolesPage() {
  const auth = useAuth()
  const canManage = auth.hasPermission("manage_roles")

  const [roles, setRoles] = React.useState<RoleWithPermissions[]>([])
  const [allPermissions, setAllPermissions] = React.useState<PermissionItem[]>([])
  const [loading, setLoading] = React.useState(true)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editRole, setEditRole] = React.useState<RoleWithPermissions | null>(null)
  const [deleteRole, setDeleteRole] = React.useState<RoleWithPermissions | null>(null)

  const loadData = React.useCallback(async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        rolesApi.getRoles(),
        rolesApi.getPermissions(),
      ])
      setRoles(rolesRes.roles)
      setAllPermissions(permsRes.permissions)
    } catch {
      toast.error("حدث خطأ في تحميل الأدوار")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  async function handleDelete() {
    if (!deleteRole) return
    try {
      await rolesApi.deleteRole(deleteRole.id)
      toast.success("تم حذف الدور بنجاح")
      setDeleteRole(null)
      loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ غير متوقع")
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
        <h1 className="text-lg font-medium">إدارة الأدوار والصلاحيات</h1>
        {canManage && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            إضافة دور
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {roles.map((role) => {
          const isSuperAdmin = role.name === SUPER_ADMIN_ROLE_NAME
          return (
            <div key={role.id} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <span className="font-medium">{role.name}</span>
                  {isSuperAdmin && (
                    <Badge variant="secondary">محمي</Badge>
                  )}
                </div>
                {canManage && !isSuperAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditRole(role)}>
                        <Pencil className="size-4" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteRole(role)}
                        className="text-destructive"
                      >
                        <Trash2 className="size-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {role.description && (
                <p className="mb-3 text-sm text-muted-foreground">
                  {role.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {role.Permissions.map((perm) => (
                  <Badge
                    key={perm.id}
                    variant="secondary"
                    title={perm.description || undefined}
                  >
                    {perm.label || perm.name}
                  </Badge>
                ))}
                {role.Permissions.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    لا توجد صلاحيات
                  </span>
                )}
              </div>
            </div>
          )
        })}
        {roles.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            لا توجد أدوار
          </p>
        )}
      </div>

      <RoleFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        allPermissions={allPermissions}
        onSuccess={loadData}
      />

      <RoleFormDialog
        role={editRole}
        open={!!editRole}
        onOpenChange={(open) => !open && setEditRole(null)}
        allPermissions={allPermissions}
        onSuccess={loadData}
      />

      <AlertDialog
        open={!!deleteRole}
        onOpenChange={(open) => !open && setDeleteRole(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الدور</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الدور &quot;{deleteRole?.name}&quot;؟ لا يمكن
              التراجع عن هذا الإجراء.
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

function RoleFormDialog({
  role,
  open,
  onOpenChange,
  allPermissions,
  onSuccess,
}: {
  role?: RoleWithPermissions | null
  open: boolean
  onOpenChange: (open: boolean) => void
  allPermissions: PermissionItem[]
  onSuccess: () => void
}) {
  const isEdit = !!role
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [selectedPermissions, setSelectedPermissions] = React.useState<number[]>([])
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (role) {
      setName(role.name)
      setDescription(role.description || "")
      setSelectedPermissions(role.Permissions.map((p) => p.id))
    } else {
      setName("")
      setDescription("")
      setSelectedPermissions([])
    }
  }, [role, open])

  function togglePermission(id: number) {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedPermissions.length === 0) {
      toast.error("يجب تحديد صلاحية واحدة على الأقل")
      return
    }
    setSubmitting(true)
    try {
      if (isEdit && role) {
        await rolesApi.updateRole(role.id, {
          name,
          description: description || undefined,
          permissionIds: selectedPermissions,
        })
        toast.success("تم تحديث الدور بنجاح")
      } else {
        await rolesApi.createRole({
          name,
          description: description || undefined,
          permissionIds: selectedPermissions,
        })
        toast.success("تم إنشاء الدور بنجاح")
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
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل الدور" : "إضافة دور جديد"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `تعديل بيانات الدور "${role?.name}"`
              : "قم بتعبئة البيانات لإنشاء دور جديد"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role-name">اسم الدور</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role-desc">الوصف (اختياري)</Label>
            <Textarea
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>الصلاحيات</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {allPermissions.map((perm) => (
                <label
                  key={perm.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedPermissions.includes(perm.id)}
                    onCheckedChange={() => togglePermission(perm.id)}
                  />
                  <div>
                    <span className="text-sm">{perm.label || perm.name}</span>
                    {perm.description && (
                      <p className="text-xs text-muted-foreground">
                        {perm.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}
              {allPermissions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  لا توجد صلاحيات متاحة
                </p>
              )}
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
              {isEdit ? "حفظ" : "إنشاء"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
