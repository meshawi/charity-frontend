import { NavLink, Outlet } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FolderTree,
  BookOpen,
  UserRoundSearch,
  HandCoins,
  ClipboardList,
  FileSpreadsheet,
  LogOut,
  Home,
  ShieldCheck,
  ClipboardCheck,
  Settings,
} from "lucide-react"

type NavItem = {
  to: string
  label: string
  icon: React.ReactNode
  permission?: string
}

const navItems: NavItem[] = [
  {
    to: "/users",
    label: "المستخدمين",
    icon: <Users className="size-4" />,
    permission: "view_users",
  },
  {
    to: "/roles",
    label: "الأدوار",
    icon: <ShieldCheck className="size-4" />,
    permission: "manage_roles",
  },
  {
    to: "/review-queue",
    label: "المراجعة",
    icon: <ClipboardCheck className="size-4" />,
    permission: "assign_category",
  },
  {
    to: "/categories",
    label: "التصنيفات",
    icon: <FolderTree className="size-4" />,
  },
  {
    to: "/programs",
    label: "البرامج",
    icon: <BookOpen className="size-4" />,
  },
  {
    to: "/beneficiaries",
    label: "المستفيدين",
    icon: <UserRoundSearch className="size-4" />,
    permission: "view_profiles",
  },
  {
    to: "/disbursement",
    label: "التوزيع",
    icon: <HandCoins className="size-4" />,
    permission: "process_disbursement",
  },
  {
    to: "/disbursements",
    label: "سجل التوزيع",
    icon: <ClipboardList className="size-4" />,
    permission: "view_disbursements",
  },
  {
    to: "/reports",
    label: "التقارير",
    icon: <FileSpreadsheet className="size-4" />,
    permission: "view_reports",
  },
  {
    to: "/field-config",
    label: "إعدادات الحقول",
    icon: <Settings className="size-4" />,
    permission: "manage_field_config",
  },
]

export function DashboardLayout() {
  const auth = useAuth()
  const user = auth.status === "authenticated" ? auth.user : null
  const hasDashboard = auth.hasPermission("view_dashboard")

  const homeItem: NavItem = hasDashboard
    ? {
        to: "/",
        label: "لوحة التحكم",
        icon: <LayoutDashboard className="size-4" />,
      }
    : {
        to: "/",
        label: "الرئيسية",
        icon: <Home className="size-4" />,
      }

  const visibleItems = [
    homeItem,
    ...navItems.filter(
      (item) => !item.permission || auth.hasPermission(item.permission)
    ),
  ]

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 flex h-svh w-56 shrink-0 flex-col overflow-y-auto border-e bg-card">
        <div className="p-4">
          <h2 className="text-sm font-medium">نظام إدارة الجمعية</h2>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Separator />
        <div className="flex items-center gap-2 p-3">
          <div className="flex-1 truncate text-sm">{user?.name}</div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => auth.logout()}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
