"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileText,
  Home,
  Upload,
  Users,
  BarChart3,
  BookOpen,
  Package,
  MessageSquareText,
  GraduationCap,
  ClipboardCheck,
  TrendingUp
} from "lucide-react"
import { NavUser } from "@/components/dashboard/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Cases", href: "/dashboard/cases", icon: FileText },
    { name: "Upload Assessment", href: "/dashboard/upload", icon: Upload },
    { name: "Assistant", href: "/dashboard/assistant", icon: MessageSquareText},
    { name: "Product Library", href: "/dashboard/products", icon: Package, disabled: false },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, disabled: true },
    { name: "Team Management", href: "/dashboard/team", icon: Users, disabled: true },
    { name: "Training Programs", href: "/dashboard/training", icon: BookOpen, disabled: true },
    { name: "Reports", href: "/dashboard/reports", icon: FileText, disabled: true },
    { name: "Learning Hub", href: "/dashboard/learning", icon: GraduationCap, disabled: true },
    { name: "Competency Tracking", href: "/dashboard/competency", icon: ClipboardCheck, disabled: true },
    { name: "Skill Development", href: "/dashboard/skills", icon: TrendingUp, disabled: true },
  ]

  return (
    <Sidebar variant="floating">
      <SidebarHeader className="flex items-center justify-center py-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="text-lg font-bold text-primary-foreground">A</span>
          </div>
          <span className="text-xl font-bold">AudiScope</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
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
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
