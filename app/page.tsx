"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/auth-provider"

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="w-full px-6 py-4 border-b border-border">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {/*<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">*/}
            {/*  <span className="text-lg font-bold text-primary-foreground">A</span>*/}
            {/*</div>*/}
            <span className="text-xl text-red-600 font-mono text-foreground">prototype</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button variant="outline" asChild>
                <Link href="/dashboard">Demo</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/login">Access</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center max-w-md mx-auto px-6 space-y-12">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mx-auto">
            <span className="text-3xl">🤫</span>
          </div>
          
          <div>
            {user ? (
              <Button size="lg" asChild>
                <Link href="/dashboard">View Demo</Link>
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}