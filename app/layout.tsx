import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import QueryProvider from "@/components/providers/query-provider";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AudiScope - EVeNTs Assessor",
  description: "Endovascular Non-Technical Skills Assessment Dashboard",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="audiscope-theme">
        <AuthProvider>
          <QueryProvider>
            {children}
            <Toaster />
            <ReactQueryDevtools initialIsOpen={false} buttonPosition={'top-right'}/>
          </QueryProvider>
        </AuthProvider>
      </ThemeProvider>
      </body>
    </html>
  )
}
