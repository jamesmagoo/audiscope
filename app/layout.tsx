import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { TenantProvider } from "@/components/providers/tenant-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import QueryProvider from "@/components/providers/query-provider";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Landy AI - AI-Native L&D Platform for MedTech",
    template: "%s | Landy AI"
  },
  description: "The first AI-native learning & development platform for medical device training. Transform product knowledge into clinical proficiency and commercial results with instant AI answers, centralized product hub, and actionable analytics.",
  keywords: [
    "medical device training",
    "MedTech L&D",
    "AI medical training",
    "IFU assistant",
    "clinical proficiency",
    "medical device knowledge platform",
    "healthcare AI",
    "product training platform"
  ],
  authors: [{ name: "Landy AI" }],
  creator: "Landy AI",
  publisher: "Landy AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://landy.ai'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Landy AI',
    title: 'Landy AI - AI-Native L&D Platform for MedTech',
    description: 'The first AI-native learning & development platform for medical device training. Accelerate device adoption and clinical proficiency with AI-powered knowledge management.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Landy AI - Medical Device Training Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Landy AI - AI-Native L&D Platform for MedTech',
    description: 'Transform medical device training with AI. Instant answers from 1000+ page IFUs, centralized product hub, and actionable analytics.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification tokens here when available
    // google: 'your-google-verification-token',
    // yandex: 'your-yandex-verification-token',
  },
  generator: 'Next.js'
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
        <TenantProvider>
          <AuthProvider>
            <QueryProvider>
              {children}
              <SpeedInsights />
              <Toaster />
              <ReactQueryDevtools initialIsOpen={false} buttonPosition={'top-right'}/>
            </QueryProvider>
          </AuthProvider>
        </TenantProvider>
      </ThemeProvider>
      </body>
    </html>
  )
}
