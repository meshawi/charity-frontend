import * as React from "react"
import { useAuth } from "@/contexts/auth-context"
import * as usersApi from "@/lib/users-api"
import * as rolesApi from "@/lib/roles-api"
import type { AdminUser } from "@/types/users"
import type { RoleWithPermissions } from "@/lib/roles-api"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  LoaderCircle,
  Plus,
  MoreHorizontal,
  Pencil,
  KeyRound,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function UsersPage() {
  const auth = useAuth()
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [roles, setRoles] = React.useState<RoleWithPermissions[]>([])
  const [loading, setLoading] = React.useState(true)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editUser, setEditUser] = React.useState<AdminUser | null>(null)
  const [resetUser, setResetUser] = React.useState<AdminUser | null>(null)

  const canCreate = auth.hasPermission("create_user")
  const canEdit = auth.hasPermission("edit_user")

  const loadData = React.useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        usersApi.getUsers(),
        auth.hasPermission("manage_roles")
          ? rolesApi.getRoles()
          : Promise.resolve(null),
      ])
      setUsers(usersRes.users)
      if (rolesRes) setRoles(rolesRes.roles)
    } catch {
      toast.error("حدث خطأ في تحميل البيانات")
    } finally {
      setLoading(false)
    }
  }, [auth])

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
        <h1 className="text-lg font-medium">إدارة المستخدمين</h1>
        <div className="flex gap-2">
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              إضافة مستخدم
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>رقم الهوية</TableHead>
              <TableHead>الأدوار</TableHead>
              <TableHead>الحالة</TableHead>
              {canEdit && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-1.5">
                    {user.name}
                    {user.isSuperAdmin && (
                      <Badge variant="destructive" className="text-xs">
                        مدير النظام
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell dir="ltr" className="text-start">
                  {user.email}
                </TableCell>
                <TableCell dir="ltr" className="text-start">
                  {user.nationalId || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.Roles.map((role) => (
                      <Badge key={role.id} variant="secondary">
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? "نشط" : "معطل"}
                  </Badge>
                </TableCell>
                {canEdit && (
                  <TableCell>
                    {!user.isSuperAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditUser(user)}>
                            <Pencil className="size-4" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setResetUser(user)}>
                            <KeyRound className="size-4" />
                            إعادة تعيين كلمة المرور
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 6 : 5}
                  className="text-center text-muted-foreground"
                >
                  لا يوجد مستخدمين
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roles={roles}
        onSuccess={loadData}
      />

      <EditUserDialog
        user={editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        roles={roles}
        onSuccess={loadData}
      />

      <ResetPasswordDialog
        user={resetUser}
        onOpenChange={(open) => !open && setResetUser(null)}
        onSuccess={() => toast.success("تم إعادة تعيين كلمة المرور بنجاح")}
      />
    </div>
  )
}

function CreateUserDialog({
  open,
  onOpenChange,
  roles,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: RoleWithPermissions[]
  onSuccess: () => void
}) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [nationalId, setNationalId] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [selectedRoles, setSelectedRoles] = React.useState<number[]>([])
  const [submitting, setSubmitting] = React.useState(false)

  function reset() {
    setName("")
    setEmail("")
    setNationalId("")
    setPassword("")
    setSelectedRoles([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await usersApi.createUser({
        name,
        email,
        password,
        nationalId: nationalId || undefined,
        roleIds: selectedRoles,
      })
      toast.success("تم إنشاء المستخدم بنجاح")
      reset()
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

  function toggleRole(id: number) {
    setSelectedRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة مستخدم جديد</DialogTitle>
          <DialogDescription>
            قم بتعبئة البيانات لإنشاء مستخدم جديد في النظام
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-name">الاسم</Label>
            <Input
              id="create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-email">البريد الإلكتروني</Label>
            <Input
              id="create-email"
              type="email"
              dir="ltr"
              className="text-left"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-nationalId">رقم الهوية (اختياري)</Label>
            <Input
              id="create-nationalId"
              dir="ltr"
              className="text-left"
              inputMode="numeric"
              value={nationalId}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 10)
                setNationalId(v)
              }}
              maxLength={10}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-password">كلمة المرور</Label>
            <Input
              id="create-password"
              type="password"
              dir="ltr"
              className="text-left"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>الأدوار</Label>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge
                  key={role.id}
                  variant={
                    selectedRoles.includes(role.id) ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleRole(role.id)}
                >
                  {role.name}
                </Badge>
              ))}
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
              إنشاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditUserDialog({
  user,
  onOpenChange,
  roles,
  onSuccess,
}: {
  user: AdminUser | null
  onOpenChange: (open: boolean) => void
  roles: RoleWithPermissions[]
  onSuccess: () => void
}) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [nationalId, setNationalId] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)
  const [selectedRoles, setSelectedRoles] = React.useState<number[]>([])
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setNationalId(user.nationalId || "")
      setIsActive(user.isActive)
      setSelectedRoles(user.Roles.map((r) => r.id))
    }
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      await usersApi.updateUser(user.id, {
        name,
        email,
        nationalId: nationalId || undefined,
        isActive,
        roleIds: selectedRoles,
      })
      toast.success("تم تحديث المستخدم بنجاح")
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

  function toggleRole(id: number) {
    setSelectedRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل المستخدم</DialogTitle>
          <DialogDescription>
            تعديل بيانات {user?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">الاسم</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-email">البريد الإلكتروني</Label>
            <Input
              id="edit-email"
              type="email"
              dir="ltr"
              className="text-left"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-nationalId">رقم الهوية</Label>
            <Input
              id="edit-nationalId"
              dir="ltr"
              className="text-left"
              inputMode="numeric"
              value={nationalId}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 10)
                setNationalId(v)
              }}
              maxLength={10}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="edit-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="edit-active">حساب نشط</Label>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>الأدوار</Label>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge
                  key={role.id}
                  variant={
                    selectedRoles.includes(role.id) ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleRole(role.id)}
                >
                  {role.name}
                </Badge>
              ))}
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

function ResetPasswordDialog({
  user,
  onOpenChange,
  onSuccess,
}: {
  user: AdminUser | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [newPassword, setNewPassword] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (user) setNewPassword("")
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      await usersApi.resetUserPassword(user.id, newPassword)
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
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
          <DialogDescription>
            إعادة تعيين كلمة مرور {user?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reset-password">كلمة المرور الجديدة</Label>
            <Input
              id="reset-password"
              type="password"
              dir="ltr"
              className="text-left"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
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
              إعادة تعيين
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


