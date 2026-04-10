import * as React from "react"
import { useAuth } from "@/contexts/auth-context"
import * as reportsApi from "@/lib/reports-api"
import * as programsApi from "@/lib/programs-api"
import * as usersApi from "@/lib/users-api"
import type { Program } from "@/types/programs"
import type { AdminUser } from "@/types/users"
import { ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { LoaderCircle, Download, FileSpreadsheet } from "lucide-react"

export default function ReportsPage() {
  const auth = useAuth()
  const canView = auth.hasPermission("view_reports")

  const [programs, setPrograms] = React.useState<Program[]>([])
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [loading, setLoading] = React.useState(true)

  const [selectedPrograms, setSelectedPrograms] = React.useState<number[]>([])
  const [selectedUsers, setSelectedUsers] = React.useState<number[]>([])
  const [allUsers, setAllUsers] = React.useState(false)

  const [exportingPrograms, setExportingPrograms] = React.useState(false)
  const [exportingEmployees, setExportingEmployees] = React.useState(false)

  React.useEffect(() => {
    if (!canView) return
    async function load() {
      try {
        const [progsRes, usersRes] = await Promise.all([
          programsApi.getPrograms().catch((err) => {
            if (err instanceof ApiError && err.status === 403) return { programs: [] as Program[] }
            throw err
          }),
          usersApi.getUsers(),
        ])
        setPrograms(progsRes.programs)
        setUsers(usersRes.users)
      } catch {
        toast.error("حدث خطأ في تحميل البيانات")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [canView])

  function toggleProgram(id: number) {
    setSelectedPrograms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  function toggleUser(id: number) {
    setAllUsers(false)
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    )
  }

  function toggleAllUsers() {
    setAllUsers((prev) => {
      if (!prev) setSelectedUsers([])
      return !prev
    })
  }

  async function handleExportPrograms() {
    if (selectedPrograms.length === 0) {
      toast.error("اختر برنامج واحد على الأقل")
      return
    }
    setExportingPrograms(true)
    try {
      await reportsApi.exportPrograms(selectedPrograms)
      toast.success("تم تصدير التقرير بنجاح")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ في التصدير")
    } finally {
      setExportingPrograms(false)
    }
  }

  async function handleExportEmployees() {
    setExportingEmployees(true)
    try {
      await reportsApi.exportEmployees(
        allUsers ? undefined : selectedUsers.length ? selectedUsers : undefined
      )
      toast.success("تم تصدير التقرير بنجاح")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ في التصدير")
    } finally {
      setExportingEmployees(false)
    }
  }

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">لا تملك صلاحية عرض التقارير</p>
      </div>
    )
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
      <div className="mb-6 flex items-center gap-2">
        <FileSpreadsheet className="size-5 text-muted-foreground" />
        <h1 className="text-lg font-medium">التقارير</h1>
      </div>

      {/* Programs Report */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold">تقارير البرامج</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          اختر برنامج أو أكثر لتصدير تقرير بتفاصيل التوزيعات
        </p>
        <div className="mb-4 rounded-lg border p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((prog) => (
              <label
                key={prog.id}
                className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-muted"
              >
                <Checkbox
                  checked={selectedPrograms.includes(prog.id)}
                  onCheckedChange={() => toggleProgram(prog.id)}
                />
                <span className="text-sm">{prog.name}</span>
                {!prog.isActive && (
                  <span className="text-xs text-muted-foreground">(غير فعال)</span>
                )}
              </label>
            ))}
            {programs.length === 0 && (
              <p className="text-sm text-muted-foreground">لا يوجد برامج</p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          disabled={selectedPrograms.length === 0 || exportingPrograms}
          onClick={handleExportPrograms}
        >
          {exportingPrograms ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          تصدير Excel ({selectedPrograms.length})
        </Button>
      </section>

      <Separator />

      {/* Employees Report */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">تقارير الموظفين</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          اختر موظف أو أكثر لتصدير تقرير بتفاصيل ما وزّعه كل موظف
        </p>
        <div className="mb-4 rounded-lg border p-4">
          <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-muted">
            <Checkbox checked={allUsers} onCheckedChange={toggleAllUsers} />
            <span className="text-sm font-medium">جميع الموظفين</span>
          </label>
          <Separator className="mb-2" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-muted"
              >
                <Checkbox
                  checked={allUsers || selectedUsers.includes(user.id)}
                  disabled={allUsers}
                  onCheckedChange={() => toggleUser(user.id)}
                />
                <span className="text-sm">{user.name}</span>
              </label>
            ))}
            {users.length === 0 && (
              <p className="text-sm text-muted-foreground">
                لا يوجد موظفين
              </p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          disabled={
            (!allUsers && selectedUsers.length === 0) || exportingEmployees
          }
          onClick={handleExportEmployees}
        >
          {exportingEmployees ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          تصدير Excel
          {!allUsers && selectedUsers.length > 0
            ? ` (${selectedUsers.length})`
            : allUsers
              ? " (الكل)"
              : ""}
        </Button>
      </section>
    </div>
  )
}
