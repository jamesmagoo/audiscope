"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Activity, Users, Mic, BarChart3, Upload, Brain, FileText, TrendingUp, Building2, Globe, Zap, Palette, Shield, Package2, Lock } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/auth-provider"

export default function LandingPage() {
  const { user } = useAuth()

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
            {user ? (
              <Button variant="outline" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            )}
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
              Elevate Clinical Excellence
              <span className="text-primary block">Through Intelligent Assessment</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
              AudiScope is the first AI-powered platform to assess EndoVascular Non-Technical Skills (EVeNTS) through
              real-time audio analysis, providing objective, scalable evaluation of communication, leadership, and
              teamwork during clinical procedures.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center">
              {user ? (
                <Button size="lg" className="px-8 py-4 text-lg" asChild>
                  <Link href="/dashboard" className="flex items-center">
                    Access Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <div className="flex gap-4">
                  <Button size="lg" className="px-8 py-4 text-lg" asChild>
                    <Link href="/signup" className="flex items-center">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="px-8 py-4 text-lg" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your clinical training in 4 simple steps. From audio capture to actionable insights.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/10 mb-6 relative">
                <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Upload Audio</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Simply upload your procedure recording. Our platform accepts any audio format from OR sessions.
              </p>
              {/* Arrow positioned absolutely */}
              <div className="hidden md:block absolute -right-4 top-10">
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6 relative">
                <Brain className="w-10 h-10 text-green-600 dark:text-green-400" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">AI Analysis</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Advanced AI processes speech patterns, identifies speakers, and analyzes team dynamics in real-time.
              </p>
              {/* Arrow positioned absolutely */}
              <div className="hidden md:block absolute -right-4 top-10">
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/10 mb-6 relative">
                <FileText className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">EVeNTS Assessment</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Comprehensive evaluation across 15 non-technical skills including leadership, communication, and decision-making.
              </p>
              {/* Arrow positioned absolutely */}
              <div className="hidden md:block absolute -right-4 top-10">
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>

            {/* Step 4 */}
            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-500/10 mb-6 relative">
                <TrendingUp className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Actionable Insights</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Receive detailed reports with strengths, improvement areas, and personalized action plans for each team member.
              </p>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="mt-16 text-center bg-primary/5 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              From Hours to Minutes
            </h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-3xl mx-auto">
              What traditionally takes expert reviewers hours to assess manually, AudiScope delivers in minutes with 
              consistent, objective, and comprehensive evaluation that scales across your entire training program.
            </p>
            <div className="flex justify-center gap-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">95%</div>
                <div className="text-muted-foreground">Time Saved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-muted-foreground">Consistent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-muted-foreground">Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* AudiScope Pro Coming Soon Section */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Coming Soon 2025
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">Introducing AudiScope Pro</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Enterprise-grade training solutions designed specifically for medical device companies
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Regulatory Compliance & Certification */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800/30 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 mb-4 mx-auto">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Regulatory Compliance</h3>
              <p className="text-sm text-muted-foreground">
                FDA, CE mark, and ISO standards compliance with automated certification tracking
              </p>
            </div>

            {/* Global Training Deployment */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800/30 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10 mb-4 mx-auto">
                <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Global Deployment</h3>
              <p className="text-sm text-muted-foreground">
                Multi-language support with regional compliance across global markets
              </p>
            </div>

            {/* Device-Specific Protocols */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-6 border border-green-100 dark:border-green-800/30 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10 mb-4 mx-auto">
                <Package2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Device-Specific Training</h3>
              <p className="text-sm text-muted-foreground">
                Customizable training protocols tailored to specific medical devices and procedures
              </p>
            </div>

            {/* Enterprise Security & Integration */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-xl p-6 border border-orange-100 dark:border-orange-800/30 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10 mb-4 mx-auto">
                <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Enterprise Security</h3>
              <p className="text-sm text-muted-foreground">
                HIPAA/GDPR compliant with seamless integration into existing training infrastructure
              </p>
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
