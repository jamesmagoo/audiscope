"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileText,
  Home,
  Users,
  BarChart3,
  BookOpen,
  Package,
  GraduationCap,
  ClipboardCheck,
  TrendingUp,
  FileEdit,
  Settings,
  Bell,
  HelpCircle
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const navItems = [
    { name: "Product Library", href: "/dashboard/products", icon: Package, disabled: false },
    { name: "Learning Hub", href: "/dashboard/learning", icon: GraduationCap, disabled: false },
    { name: "Content Management", href: "/dashboard/content", icon: FileEdit, disabled: false },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, disabled: true, showDisabled: true },
    { name: "Team Management", href: "/dashboard/team", icon: Users, disabled: true, showDisabled: true },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell, disabled: true, showDisabled: true },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, disabled: true, showDisabled: true },
    { name: "Help & Support", href: "/dashboard/support", icon: HelpCircle, disabled: true, showDisabled: true },
    { name: "Training Programs", href: "/dashboard/training", icon: BookOpen, disabled: true, showDisabled: false },
    { name: "NOTTS", href: "/dashboard", icon: Home, disabled: true, showDisabled: false },
    { name: "Case Analysis", href: "/dashboard/cases", icon: FileText, disabled: true, showDisabled: false },
    { name: "Reports", href: "/dashboard/reports", icon: FileText, disabled: true, showDisabled: false },
    { name: "Competency Tracking", href: "/dashboard/competency", icon: ClipboardCheck, disabled: true, showDisabled: false },
    { name: "Skill Development", href: "/dashboard/skills", icon: TrendingUp, disabled: true, showDisabled: false },
  ]

  return (
    <Sidebar variant="floating">
      <SidebarHeader className="flex flex-col items-start py-4 px-4">
        <Link href="/" className="flex items-center gap-3 w-full">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary flex-shrink-0">
            <span className="text-3xl font-bold text-primary-foreground">📚</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-bold leading-tight">Landy AI</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Learning & Development</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems
            .filter((item) => !item.disabled || item.showDisabled)
            .map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild={!item.disabled}
                  isActive={!item.disabled && (item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href))}
                  className={item.disabled ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""}
                >
                  {item.disabled ? (
                    <div className="flex items-center gap-2 w-full">
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                  ) : (
                    <Link href={item.href} onClick={handleNavClick}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
