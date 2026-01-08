import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap, ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>

      <div className="container mx-auto px-4 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-8 backdrop-blur-sm"
          data-track="hero-badge"
        >
          <Zap className="mr-2 h-3.5 w-3.5 fill-primary" />
          The First AI-Native L&D Platform for MedTech
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-tight">
          Accelerate Device Adoption & Clinical Proficiency.
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          Turn product knowledge into commercial results and better patient outcomes. The first AI platform designed for the entire MedTech lifecycle.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="h-12 px-8 text-lg rounded-full shadow-lg"
            asChild
            data-track="hero-cta-demo"
          >
            <a href="mailto:sales@landy.ai?subject=Book%20a%20Demo&body=Hi%2C%20I%27d%20like%20to%20schedule%20a%20demo%20of%20Landy%20AI.">
              Book a Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-8 text-lg rounded-full"
            asChild
            data-track="hero-cta-try"
          >
            <Link href="/dashboard">
              <Sparkles className="mr-2 h-5 w-5" />
              Try AI Assistant
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
