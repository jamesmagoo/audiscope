"use client"

import { LandingHeader } from "@/components/landing/landing-header"
import { HeroSection } from "@/components/landing/hero-section"
import { AIAssistantSection } from "@/components/landing/ai-assistant-section"
import { ProductHubSection } from "@/components/landing/product-hub-section"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { InnovationSection } from "@/components/landing/innovation-section"
import { MobileAppsSection } from "@/components/landing/mobile-apps-section"
import { CTASection } from "@/components/landing/cta-section"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingHeader />

      <main className="flex-1">
        <HeroSection />
        <AIAssistantSection />
        <ProductHubSection />
        <FeaturesGrid />
        <InnovationSection />
        <MobileAppsSection />
        <CTASection />
      </main>

      <LandingFooter />
    </div>
  )
}
