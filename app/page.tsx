"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/providers/auth-provider"
import * as React from "react"
import {
  Brain,
  Database,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  MessageSquareText,
  Sparkles,
  FileText,
  Rocket,
  Award,
  Target
} from "lucide-react"

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">Landy AI</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#assistant" className="hover:text-primary transition-colors">AI Assistant</Link>
            <Link href="#products" className="hover:text-primary transition-colors">Product Hub</Link>
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
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

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>

          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-8 backdrop-blur-sm">
              <Zap className="mr-2 h-3.5 w-3.5 fill-primary" />
              The First AI-Native L&D Platform for MedTech
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-tight">
              Accelerate Device Adoption & Clinical Proficiency.
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Turn product knowledge into commercial results and better patient outcomes. The first AI platform designed for the entire MedTech lifecycle.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-lg" asChild>
                <a href="mailto:sales@landy.ai?subject=Book%20a%20Demo&body=Hi%2C%20I%27d%20like%20to%20schedule%20a%20demo%20of%20Landy%20AI.">
                  Book a Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full" asChild>
                <Link href="/dashboard">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Try AI Assistant
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* AI Assistant Deep Dive - MOVED UP */}
        <section id="assistant" className="py-24 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  AI Product Assistant
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ask 1000+ page IFUs. Get answers in seconds.</h2>
                <p className="text-lg text-muted-foreground max-w-xl">
                  Your teams shouldn't have to memorize every page of every IFU. Landy AI digests your technical documents and videos to provide instant, cited answers to any product question.
                </p>

                <ul className="space-y-4">
                  {[
                    "Chat with your entire product library instantly",
                    "Every answer cited directly to source PDFs",
                    "Synthesize information across multiple documents",
                    "Available 24/7 on any device, anywhere"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button size="lg" className="mt-4" asChild>
                  <Link href="/dashboard">
                    Try the Assistant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="flex-1 w-full max-w-lg lg:max-w-none">
                <div className="relative rounded-2xl border border-border bg-background shadow-2xl p-2">
                   <div className="rounded-xl bg-muted aspect-square flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-cyan-500/5 flex flex-col p-6">
                         {/* Chat UI Mockup */}
                         <div className="flex-1 space-y-6 overflow-hidden">
                            {/* User Msg */}
                            <div className="flex justify-end">
                                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-5 py-3 text-sm shadow-md max-w-[85%]">
                                    What are the contraindications for the pediatric valve?
                                </div>
                            </div>
                            {/* AI Msg */}
                            <div className="flex justify-start">
                                <div className="flex gap-3 max-w-[90%]">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Brain className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="bg-background border border-border rounded-2xl rounded-tl-sm px-5 py-4 text-sm shadow-md">
                                            <p className="mb-2">
                                                According to the IFU, contraindications include active endocarditis and known hypersensitivity to titanium.
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded border border-border/50">
                                                <FileText className="h-3 w-3" />
                                                <span>Source: Pediatric Valve IFU (Page 42)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                             {/* User Msg 2 */}
                             <div className="flex justify-end opacity-50">
                                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-5 py-3 text-sm shadow-md max-w-[85%]">
                                    What's the recommended sizing?
                                </div>
                            </div>
                         </div>
                         {/* Input Area */}
                         <div className="mt-4 relative">
                            <div className="h-12 w-full bg-muted/50 rounded-full border border-border flex items-center px-4 text-sm text-muted-foreground">
                                Ask anything about your products...
                            </div>
                            <div className="absolute right-2 top-2 h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                                <ArrowRight className="h-4 w-4 text-primary-foreground" />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Hub Deep Dive - MOVED UP */}
        <section id="products" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-900/20 px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400">
                  <Database className="mr-2 h-3.5 w-3.5" />
                  Product Hub
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">One platform for your entire portfolio.</h2>
                <p className="text-lg text-muted-foreground max-w-xl">
                  Centralize 50+ medical devices in one intelligent hub. Empower sales and clinical teams with instant access to the latest product information, training materials, and documentation.
                </p>

                <ul className="space-y-4">
                  {[
                    "Central repository for IFUs, specs, and training materials",
                    "Video and image galleries for every device",
                    "Automatic version control and update notifications",
                    "Mobile-optimized for field access"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button size="lg" variant="outline" className="mt-4" asChild>
                  <Link href="/dashboard/products">
                    Explore Product Hub
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="flex-1 w-full max-w-lg lg:max-w-none">
                <div className="relative rounded-2xl border border-border bg-background shadow-2xl p-2">
                  <div className="rounded-xl bg-muted aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/5 to-pink-500/5 p-8">
                        <div className="grid grid-cols-2 gap-4 h-full">
                           <div className="bg-background rounded-lg shadow-sm border border-border/50 p-4 flex flex-col gap-2">
                              <div className="h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-md w-full mb-2 flex items-center justify-center">
                                <Database className="h-12 w-12 text-primary/30" />
                              </div>
                              <div className="h-3 bg-muted rounded w-2/3"></div>
                              <div className="h-2 bg-muted rounded w-1/2"></div>
                           </div>
                           <div className="bg-background rounded-lg shadow-sm border border-border/50 p-4 flex flex-col gap-2 mt-8">
                              <div className="h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-md w-full mb-2 flex items-center justify-center">
                                <FileText className="h-12 w-12 text-purple-500/30" />
                              </div>
                              <div className="h-3 bg-muted rounded w-2/3"></div>
                              <div className="h-2 bg-muted rounded w-1/2"></div>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Grid - MOVED DOWN */}
        <section id="features" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to scale excellence</h2>
              <p className="text-lg text-muted-foreground">
                From product launch to clinical mastery, our integrated platform bridges the gap between technical knowledge and field application.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1 text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <MessageSquareText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Instant AI Answers</h3>
                <p className="text-muted-foreground">
                  Get answers from 1000+ page IFUs instantly. Stop searching through PDFs and ask Landy for specs, contraindications, and clinical data.
                </p>
              </div>

              <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1 text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Centralized Product Hub</h3>
                <p className="text-muted-foreground">
                  One platform for your entire portfolio. All product documentation, IFUs, and training assets in a single, searchable hub.
                </p>
              </div>

              <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1 text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Actionable Analytics</h3>
                <p className="text-muted-foreground">
                  Track proficiency gaps, monitor training progress, and certify field teams faster with data-driven insights.
                </p>
              </div>

              <div className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1 text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Enterprise Security</h3>
                <p className="text-muted-foreground">
                  Bank-grade encryption and role-based access control ensure your proprietary data and training materials remain secure.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Innovation Leader Section - REPLACES "Trusted By" */}
        <section className="py-24 bg-background border-y border-border/40">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 mb-6">
                <Rocket className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Innovation Leader</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">The First AI-Native L&D Platform for MedTech</h2>
              <p className="text-lg text-muted-foreground mb-12">
                Pioneering the future of medical device training with cutting-edge AI technology
              </p>

              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="space-y-3">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Rocket className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">First-Mover Advantage</h3>
                  <p className="text-sm text-muted-foreground">
                    Built from the ground up for the AI era, not retrofitted onto legacy systems
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Award className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Expert-Built</h3>
                  <p className="text-sm text-muted-foreground">
                    Built by doctors, surgeons, and medical device specialists who understand MedTech
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Enterprise-Ready</h3>
                  <p className="text-sm text-muted-foreground">
                    Powered by AWS Bedrock & Claude AI with enterprise-grade security
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Apps Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Coming Soon</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Access Landy AI anywhere, anytime</h2>
              <p className="text-lg text-muted-foreground">
                Take the power of AI-driven training with you. Our mobile apps bring instant product knowledge to your fingertips.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-2xl mx-auto">
              <a
                href="#"
                className="group flex items-center gap-4 px-8 py-4 bg-background border border-border rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1 w-full sm:w-auto"
              >
                <svg className="h-12 w-12 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">Download on the</div>
                  <div className="text-xl font-semibold">App Store</div>
                </div>
              </a>

              <a
                href="#"
                className="group flex items-center gap-4 px-8 py-4 bg-background border border-border rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1 w-full sm:w-auto"
              >
                <svg className="h-12 w-12 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">Get it on</div>
                  <div className="text-xl font-semibold">Google Play</div>
                </div>
              </a>
            </div>

            <p className="text-center mt-8 text-sm text-muted-foreground">
              Mobile apps launching Q1 2025 • Early access available for enterprise customers
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-b from-primary/5 to-background border-y border-primary/10">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to transform your training?</h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join the pioneering medical device companies using Landy AI to drive clinical excellence and business growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/20" asChild>
                <a href="mailto:sales@landy.ai?subject=Book%20a%20Demo&body=Hi%2C%20I%27d%20like%20to%20schedule%20a%20demo%20of%20Landy%20AI.">
                  Book a Demo
                </a>
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full bg-background" asChild>
                <a href="mailto:sales@landy.ai?subject=Contact%20Sales&body=Hi%2C%20I%27d%20like%20to%20learn%20more%20about%20Landy%20AI.">
                  Contact Sales
                </a>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Schedule a personalized demo • Enterprise-ready
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary/10 p-1.5 rounded-lg">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl font-bold tracking-tight">Landy AI</span>
              </div>
              <p className="text-muted-foreground max-w-xs">
                The first AI-native learning & development platform for medical device training and product management.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#assistant" className="hover:text-primary">AI Assistant</Link></li>
                <li><Link href="#products" className="hover:text-primary">Product Hub</Link></li>
                <li><Link href="#features" className="hover:text-primary">Features</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary">Platform</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:sales@landy.ai" className="hover:text-primary">Contact</a></li>
                <li><Link href="#" className="hover:text-primary">About Us</Link></li>
                <li><Link href="#" className="hover:text-primary">Careers</Link></li>
                <li><Link href="#" className="hover:text-primary">Blog</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2025 Landy AI. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-primary">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary">Terms of Service</Link>
              <Link href="#" className="hover:text-primary">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
