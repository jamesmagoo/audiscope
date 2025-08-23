"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  FileText,
  Home,
  Upload,
  Users,
  LogOut,
  BarChart3,
  BookOpen,
  Package,
  MessageSquareText
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
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
  const router = useRouter()
  const { user, signOutUser } = useAuth()
  const { setOpenMobile, isMobile } = useSidebar()

  const getInitials = (email: string) => {
    if (!email) return 'U'
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const handleSignOut = async () => {
    try {
      await signOutUser()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

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
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, disabled: true },
    { name: "Team Management", href: "/dashboard/team", icon: Users, disabled: true },
    { name: "Training Programs", href: "/dashboard/training", icon: BookOpen, disabled: true },
    { name: "Device Library", href: "/dashboard/devices", icon: Package, disabled: true },
    { name: "Reports", href: "/dashboard/reports", icon: FileText, disabled: true },
  ]

  return (
    <Sidebar>
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
      <SidebarFooter className="p-4">
        <div className="space-y-3">
          {/* User Info Card */}
          <div className="flex items-center space-x-3 rounded-lg bg-muted/50 border border-border/50 p-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <span className="font-semibold text-primary-foreground text-sm">
                {user?.email ? getInitials(user.email) : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">
                {user?.username ? truncateText(user.username, 16) : 'User'}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {user?.email ? truncateText(user.email, 20) : 'No email'}
              </p>
            </div>
          </div>
          
          {/* Logout Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
