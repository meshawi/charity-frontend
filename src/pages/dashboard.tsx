import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/components/theme-provider"
import * as dashboardApi from "@/lib/dashboard-api"
import { changeOwnPassword } from "@/lib/users-api"
import type {
  DashboardStats,
  DailyStatPoint,
  RecentProfile,
} from "@/types/dashboard"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatDateShort } from "@/lib/date-utils"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LoaderCircle,
  Users,
  UserRoundSearch,
  HandCoins,
  Sun,
  Moon,
} from "lucide-react"

const COLOR_PRESETS = [
  { value: "blue", label: "أزرق", hue: 250 },
  { value: "teal", label: "أخضر", hue: 165 },
  { value: "purple", label: "بنفسجي", hue: 290 },
  { value: "rose", label: "وردي", hue: 350 },
  { value: "amber", label: "برتقالي", hue: 55 },
] as const

const chartConfig = {
  beneficiaries: {
    label: "المستفيدون الجدد",
    color: "var(--chart-1)",
  },
  disbursements: {
    label: "الصرفيات",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export default function DashboardPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const canView = auth.hasPermission("view_dashboard")

  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [dailyStats, setDailyStats] = React.useState<DailyStatPoint[]>([])
  const [recentProfiles, setRecentProfiles] = React.useState<RecentProfile[]>(
    []
  )
  const [loading, setLoading] = React.useState(true)
  const [days, setDays] = React.useState<"7" | "30" | "90">("7")
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("beneficiaries")
  const [colorTheme, setColorTheme] = React.useState(
    () => localStorage.getItem("color-theme") || "blue"
  )
  const [pwDialogOpen, setPwDialogOpen] = React.useState(false)

  React.useEffect(() => {
    document.documentElement.setAttribute("data-color", colorTheme)
    localStorage.setItem("color-theme", colorTheme)
  }, [colorTheme])

  const total = React.useMemo(
    () => ({
      beneficiaries: dailyStats.reduce((s, d) => s + d.beneficiaries, 0),
      disbursements: dailyStats.reduce((s, d) => s + d.disbursements, 0),
    }),
    [dailyStats]
  )

  React.useEffect(() => {
    if (!canView) {
      setLoading(false)
      return
    }
    async function load() {
      try {
        const [statsRes, dailyRes, profilesRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getDailyStats(Number(days) as 7 | 30 | 90),
          dashboardApi.getRecentProfiles(),
        ])
        setStats(statsRes.stats)
        setDailyStats(dailyRes.data)
        if (dailyRes.defaultChart === "beneficiaries" || dailyRes.defaultChart === "disbursements") {
          setActiveChart(dailyRes.defaultChart)
        }
        setRecentProfiles(profilesRes.profiles)
      } catch {
        toast.error("حدث خطأ في تحميل بيانات لوحة التحكم")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [canView, days])

  if (!canView) {
    const user = auth.status === "authenticated" ? auth.user : null
    return (
      <div className="mx-auto max-w-xl space-y-6 p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Users className="size-7 text-primary" />
            </div>
            <CardTitle className="text-xl">
              مرحباً {user?.name}
            </CardTitle>
            <CardDescription>
              أهلاً بك في {import.meta.env.VITE_BRAND_NAME || "نظام إدارة الجمعية"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {user?.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    البريد الإلكتروني
                  </span>
                  <span dir="ltr">{user.email}</span>
                </div>
              )}
              {user?.roles && user.roles.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الأدوار</span>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((name) => (
                      <Badge key={name} variant="secondary">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <SettingsCard
          theme={theme}
          setTheme={setTheme}
          colorTheme={colorTheme}
          setColorTheme={setColorTheme}
          onChangePassword={() => setPwDialogOpen(true)}
        />

        <ChangePasswordDialog
          open={pwDialogOpen}
          onOpenChange={setPwDialogOpen}
        />
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

  const daysLabel =
    days === "7" ? "7 أيام" : days === "30" ? "30 يوم" : "90 يوم"

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-lg font-medium">لوحة التحكم</h1>

      {/* --- Stats Cards --- */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card size="sm">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardDescription>المستخدمين</CardDescription>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.total}</div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardDescription>المستفيدين</CardDescription>
              <UserRoundSearch className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.profiles.total}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.profiles.newThisMonth} هذا الشهر
              </p>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardDescription>الصرفيات</CardDescription>
              <HandCoins className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.disbursements.total}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.disbursements.thisMonth} هذا الشهر &middot;{" "}
                {stats.disbursements.today} اليوم
              </p>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardDescription>التصنيفات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {stats.profiles.byCategory.map((cat) => (
                  <Badge
                    key={cat.categoryId}
                    variant="outline"
                    style={{
                      borderColor: cat.color,
                      color: cat.color,
                    }}
                  >
                    {cat.name}: {cat.count}
                  </Badge>
                ))}
                {stats.profiles.byCategory.length === 0 && (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- Bar Chart --- */}
      <Card className="pt-0">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>الإحصائيات اليومية</CardTitle>
            <CardDescription>
              المستفيدون الجدد والصرفيات خلال آخر {daysLabel}
            </CardDescription>
            <Select
              value={days}
              onValueChange={(v) => setDays(v as "7" | "30" | "90")}
            >
              <SelectTrigger
                className="mt-2 w-[140px] rounded-lg"
                aria-label="اختر النطاق الزمني"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="7" className="rounded-lg">
                  7 أيام
                </SelectItem>
                <SelectItem value="30" className="rounded-lg">
                  30 يوم
                </SelectItem>
                <SelectItem value="90" className="rounded-lg">
                  90 يوم
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex">
            {(["beneficiaries", "disbursements"] as const).map((key) => (
              <button
                key={key}
                data-active={activeChart === key}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-start even:border-s data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-s sm:px-8 sm:py-6"
                onClick={() => setActiveChart(key)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[key].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key].toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <BarChart
              data={dailyStats}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="dateAr"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    labelFormatter={(_value, payload) => {
                      const point = payload?.[0]?.payload as DailyStatPoint | undefined
                      return point?.dateAr ?? _value
                    }}
                  />
                }
              />
              <Bar
                dataKey={activeChart}
                fill={`var(--color-${activeChart})`}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* --- Bottom Grid: Settings + Recent Profiles --- */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings */}
        <SettingsCard
          theme={theme}
          setTheme={setTheme}
          colorTheme={colorTheme}
          setColorTheme={setColorTheme}
          onChangePassword={() => setPwDialogOpen(true)}
        />

        <ChangePasswordDialog
          open={pwDialogOpen}
          onOpenChange={setPwDialogOpen}
        />

        {/* Recent Profiles */}
        <Card>
          <CardHeader>
            <CardTitle>آخر المستفيدين</CardTitle>
            <CardDescription>آخر 5 مستفيدين تم إنشاؤهم</CardDescription>
          </CardHeader>
          <CardContent>
            {recentProfiles.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>التصنيف</TableHead>
                      <TableHead>بواسطة</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentProfiles.map((p) => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/beneficiaries/${p.id}`)}
                      >
                        <TableCell className="font-medium">
                          {p.name || p.nationalId}
                        </TableCell>
                        <TableCell>
                          {p.category ? (
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: p.category.color,
                                color: p.category.color,
                              }}
                            >
                              {p.category.name}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.createdBy.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateShort(p.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا يوجد مستفيدين</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SettingsCard({
  theme,
  setTheme,
  colorTheme,
  setColorTheme,
  onChangePassword,
}: {
  theme: string
  setTheme: (t: "light" | "dark") => void
  colorTheme: string
  setColorTheme: (c: string) => void
  onChangePassword: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>الإعدادات</CardTitle>
        <CardDescription>
          تخصيص مظهر الواجهة وإعدادات الحساب
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Theme */}
        <div className="space-y-3">
          <span className="text-sm font-medium ">المظهر</span>
          <div className="flex gap-3 py-1.5">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors",
                theme === "light"
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Sun className="size-4" />
              فاتح
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors",
                theme === "dark"
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Moon className="size-4" />
              داكن
            </button>
          </div>
        </div>
        {/* Colors */}
        <div className="space-y-2">
          <div className="flex justify-center gap-3">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setColorTheme(preset.value)}
                title={preset.label}
                className={cn(
                  "size-9 rounded-full border-2 transition-all",
                  colorTheme === preset.value
                    ? "scale-110 border-foreground ring-2 ring-foreground/20"
                    : "border-transparent hover:scale-105"
                )}
                style={{
                  backgroundColor: `oklch(0.55 0.15 ${preset.hue})`,
                }}
              />
            ))}
          </div>
        </div>

        <hr className="border-border" />

        {/* Change Password */}
        <div>
          <Button variant="outline" onClick={onChangePassword}>
            تغيير كلمة المرور
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين")
      return
    }
    setSubmitting(true)
    try {
      await changeOwnPassword(currentPassword, newPassword)
      toast.success("تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول مجدداً.")
      onOpenChange(false)
      window.location.href = "/login"
    } catch {
      setError("حدث خطأ في تغيير كلمة المرور")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تغيير كلمة المرور</DialogTitle>
          <DialogDescription>
            أدخل كلمة المرور الحالية والجديدة. سيتم تسجيل خروجك بعد التغيير.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">كلمة المرور الحالية</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">كلمة المرور الجديدة</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">تأكيد كلمة المرور</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                "تغيير"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
