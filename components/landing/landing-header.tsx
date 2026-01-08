"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/providers/auth-provider"
import { Brain } from "lucide-react"

export function LandingHeader() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">Landy AI</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="#assistant" className="hover:text-primary transition-colors">
            AI Assistant
          </Link>
          <Link href="#products" className="hover:text-primary transition-colors">
            Product Hub
          </Link>
          <Link href="#features" className="hover:text-primary transition-colors">
            Features
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <Button asChild>
              <Link href="/dashboard/products">Go to Dashboard</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
