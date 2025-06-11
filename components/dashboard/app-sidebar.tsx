"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, FileText, Home, Upload, Users } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Cases", href: "/dashboard/cases", icon: FileText },
    { name: "Upload Assessment", href: "/dashboard/upload", icon: Upload },
    { name: "Analytics", href: "/dashboard/analytics", icon: Activity },
    { name: "Team", href: "/dashboard/team", icon: Users },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-center py-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
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
                asChild
                isActive={item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center space-x-3 rounded-md bg-muted p-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-medium text-primary">US</span>
          </div>
          <div>
            <p className="text-sm font-medium">Dr. User</p>
            <p className="text-xs text-muted-foreground">user@hospital.org</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
