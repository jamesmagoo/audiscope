import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Activity, Users, Mic, BarChart3 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <span className="text-lg font-bold text-primary-foreground">A</span>
            </div>
            <span className="text-xl font-bold text-foreground">AudiScope</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Activity className="w-4 h-4 mr-2" />
              AI-Powered Clinical Assessment
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Revolutionizing
              <span className="text-primary block">Clinical Skills Assessment</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
              AudiScope is the first AI-powered platform to assess EndoVascular Non-Technical Skills (EVeNTS) through
              real-time audio analysis, providing objective, scalable evaluation of communication, leadership, and
              teamwork during clinical procedures.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center">
              <Button size="lg" className="px-8 py-4 text-lg" asChild>
                <Link href="/dashboard" className="flex items-center">
                  Access Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Real-time Audio Analysis</h3>
              <p className="text-muted-foreground">
                Advanced AI processes live audio to identify communication patterns and team dynamics
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">EVeNTS Framework</h3>
              <p className="text-muted-foreground">
                Structured assessment of leadership, communication, situational awareness, and decision-making
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4">
                <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Objective Insights</h3>
              <p className="text-muted-foreground">
                Data-driven feedback and actionable recommendations for continuous improvement
              </p>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500/10 rounded-full filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                <span className="text-sm font-bold text-primary-foreground">A</span>
              </div>
              <span className="text-lg font-semibold text-foreground">AudiScope</span>
            </div>
            <p className="text-muted-foreground text-sm">© 2025 AudiScope. Advancing clinical education through AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
