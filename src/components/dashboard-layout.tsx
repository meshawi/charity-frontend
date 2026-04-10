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
  FileSignature,
  ScrollText,
} from "lucide-react"

type NavItem = {
  to: string
  label: string
  icon: React.ReactNode
  permission?: string
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "الإدارة",
    items: [
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
    ],
  },
  {
    title: "المستفيدين",
    items: [
      {
        to: "/beneficiaries",
        label: "المستفيدين",
        icon: <UserRoundSearch className="size-4" />,
        permission: "view_profiles",
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
        permission: "view_profiles",
      },
    ],
  },
  {
    title: "التوزيع والإقرارات",
    items: [
      {
        to: "/programs",
        label: "البرامج",
        icon: <BookOpen className="size-4" />,
        permission: "manage_programs",
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
        to: "/pledge",
        label: "إقرار وتعهد",
        icon: <FileSignature className="size-4" />,
        permission: "process_pledge",
      },
      {
        to: "/pledges",
        label: "سجل الإقرارات",
        icon: <ScrollText className="size-4" />,
        permission: "view_pledges",
      },
    ],
  },
  {
    title: "التقارير والإعدادات",
    items: [
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
    ],
  },
]

export function DashboardLayout() {
  const auth = useAuth()
  const user = auth.status === "authenticated" ? auth.user : null
  const hasDashboard = auth.hasPermission("view_dashboard")

  const brandName =
    import.meta.env.VITE_BRAND_NAME || "نظام إدارة الجمعية"
  const devName = import.meta.env.VITE_DEV_NAME
  const devUrl = import.meta.env.VITE_DEV_URL

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

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || auth.hasPermission(item.permission)
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 flex h-svh w-56 shrink-0 flex-col overflow-y-auto border-e bg-card">
        <div className="flex items-center gap-2.5 p-4">
          <img
            src="/brand.png"
            alt=""
            className="size-8 shrink-0 rounded object-contain"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = "none"
            }}
          />
          <h2 className="text-sm font-medium leading-tight">{brandName}</h2>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-2">
          <NavLink
            to={homeItem.to}
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            {homeItem.icon}
            {homeItem.label}
          </NavLink>
          {visibleGroups.map((group) => (
            <div key={group.title} className="mt-3">
              <span className="mb-1 block px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
                {group.title}
              </span>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
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
            </div>
          ))}
        </nav>
        <Separator />
        {devName && (
          <div className="px-3 pt-2 text-center text-[10px] text-muted-foreground/60">
           تم تطويره بواسطة{" "}
            {devUrl ? (
              <a
                href={devUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                {devName}
              </a>
            ) : (
              <span className="font-medium">{devName}</span>
            )}
          </div>
        )}
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
