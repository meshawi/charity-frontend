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
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
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
  X,
} from "lucide-react"

const SUPER_ADMIN_ROLE_NAME = "مدير النظام"

const PERMISSION_GROUP_LABELS: Record<string, string> = {
  view: "عرض البيانات",
  manage: "إدارة",
  process: "معالجة",
  assign: "تعيين",
  approve: "اعتماد",
}

function groupPermissions(permissions: PermissionItem[]) {
  const groups: Record<string, PermissionItem[]> = {}
  for (const perm of permissions) {
    const prefix = perm.name.split("_")[0]
    const key = PERMISSION_GROUP_LABELS[prefix] ? prefix : "other"
    if (!groups[key]) groups[key] = []
    groups[key].push(perm)
  }
  return Object.entries(groups).map(([key, perms]) => ({
    key,
    label: PERMISSION_GROUP_LABELS[key] || "أخرى",
    permissions: perms,
  }))
}

export default function RolesPage() {
  const auth = useAuth()
  const canManage = auth.hasPermission("manage_roles")

  const [roles, setRoles] = React.useState<RoleWithPermissions[]>([])
  const [allPermissions, setAllPermissions] = React.useState<PermissionItem[]>([])
  const [loading, setLoading] = React.useState(true)

  const [formMode, setFormMode] = React.useState<"closed" | "create" | "edit">(
    "closed"
  )
  const [editRole, setEditRole] = React.useState<RoleWithPermissions | null>(
    null
  )
  const [deleteRole, setDeleteRole] = React.useState<RoleWithPermissions | null>(
    null
  )

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

  function openCreate() {
    setEditRole(null)
    setFormMode("create")
  }

  function openEdit(role: RoleWithPermissions) {
    setEditRole(role)
    setFormMode("edit")
  }

  function closeForm() {
    setFormMode("closed")
    setEditRole(null)
  }

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
        {canManage && formMode === "closed" && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            إضافة دور
          </Button>
        )}
      </div>

      {/* Inline form */}
      {formMode !== "closed" && (
        <>
          <RoleFormSection
            role={editRole}
            allPermissions={allPermissions}
            onCancel={closeForm}
            onSuccess={() => {
              closeForm()
              loadData()
            }}
          />
          <Separator className="my-6" />
        </>
      )}

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
                      <DropdownMenuItem onClick={() => openEdit(role)}>
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

function RoleFormSection({
  role,
  allPermissions,
  onCancel,
  onSuccess,
}: {
  role?: RoleWithPermissions | null
  allPermissions: PermissionItem[]
  onCancel: () => void
  onSuccess: () => void
}) {
  const isEdit = !!role
  const [name, setName] = React.useState(role?.name || "")
  const [description, setDescription] = React.useState(
    role?.description || ""
  )
  const [selectedPermissions, setSelectedPermissions] = React.useState<
    number[]
  >(role?.Permissions.map((p) => p.id) || [])
  const [submitting, setSubmitting] = React.useState(false)

  const groups = React.useMemo(
    () => groupPermissions(allPermissions),
    [allPermissions]
  )

  function togglePermission(id: number) {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  function toggleGroup(groupPerms: PermissionItem[]) {
    const ids = groupPerms.map((p) => p.id)
    const allSelected = ids.every((id) => selectedPermissions.includes(id))
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !ids.includes(id)))
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...ids])])
    }
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
      onSuccess()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ غير متوقع")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-medium">
          {isEdit ? `تعديل الدور "${role?.name}"` : "إضافة دور جديد"}
        </h2>
        <Button variant="ghost" size="icon-sm" onClick={onCancel}>
          <X className="size-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <Input
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>الصلاحيات</Label>
          {groups.map((group) => {
            const groupIds = group.permissions.map((p) => p.id)
            const allSelected = groupIds.every((id) =>
              selectedPermissions.includes(id)
            )
            const someSelected =
              !allSelected &&
              groupIds.some((id) => selectedPermissions.includes(id))

            return (
              <div key={group.key} className="rounded-lg border bg-card">
                <div className="flex items-center gap-2 border-b px-4 py-2.5">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={() => toggleGroup(group.permissions)}
                  />
                  <span className="text-sm font-medium">{group.label}</span>
                  <Badge variant="outline" className="mr-auto text-[10px]">
                    {
                      groupIds.filter((id) =>
                        selectedPermissions.includes(id)
                      ).length
                    }
                    /{groupIds.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-1 p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.permissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedPermissions.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="text-sm">
                          {perm.label || perm.name}
                        </span>
                        {perm.description && (
                          <p className="text-xs text-muted-foreground">
                            {perm.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
          {allPermissions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              لا توجد صلاحيات متاحة
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting && <LoaderCircle className="animate-spin" />}
            {isEdit ? "حفظ التعديلات" : "إنشاء الدور"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  )
}
