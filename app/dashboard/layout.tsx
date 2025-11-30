import type React from "react"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AuthGuard } from "@/components/providers/auth-guard"
import { Separator } from "@/components/ui/separator"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { CommandMenu } from "@/components/dashboard/command-menu"
import { CommandTrigger } from "@/components/dashboard/command-trigger"
import { ThemeToggle } from "@/components/dashboard/theme-toggle"
import { Notifications } from "@/components/dashboard/notifications"
import { GlobalSearch } from "@/components/dashboard/global-search"
import { HeaderUser } from "@/components/dashboard/header-user"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 lg:px-6">
            {/* Left Section */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
              <Breadcrumbs />
            </div>

            {/* Center Section - Search (hidden on mobile) */}
            <div className="hidden md:flex flex-1 justify-center">
              <GlobalSearch />
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1 ml-auto md:ml-0">
              <CommandTrigger />
              <Notifications />
              <ThemeToggle />
              <Separator orientation="vertical" className="h-4 mx-1" />
              <HeaderUser />
            </div>
          </header>
          <CommandMenu />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
