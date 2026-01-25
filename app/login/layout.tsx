import type React from "react"
import { TenantProvider } from "@/components/providers/tenant-provider"
import { AuthProvider } from "@/components/providers/auth-provider"

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <TenantProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </TenantProvider>
  )
}
