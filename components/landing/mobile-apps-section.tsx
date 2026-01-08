import { Sparkles } from "lucide-react"

export function MobileAppsSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Coming Soon
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Access Landy AI anywhere, anytime
          </h2>
          <p className="text-lg text-muted-foreground">
            Take the power of AI-driven training with you. Our mobile apps bring instant product knowledge to your fingertips.
          </p>
        </div>

        {/* App Store Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-2xl mx-auto">
          {/* App Store Button */}
          <a
            href="#"
            className="group flex items-center gap-4 px-8 py-4 bg-background border border-border rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1 w-full sm:w-auto"
            data-track="mobile-app-store"
          >
            <svg className="h-12 w-12 text-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="text-left">
              <div className="text-xs text-muted-foreground">Download on the</div>
              <div className="text-xl font-semibold">App Store</div>
            </div>
          </a>

          {/* Google Play Button */}
          <a
            href="#"
            className="group flex items-center gap-4 px-8 py-4 bg-background border border-border rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1 w-full sm:w-auto"
            data-track="mobile-google-play"
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

        {/* Launch Info */}
        <p className="text-center mt-8 text-sm text-muted-foreground">
          Mobile apps launching Q1 2025 • Early access available for enterprise customers
        </p>
      </div>
    </section>
  )
}
