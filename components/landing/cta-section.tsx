import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-b from-primary/5 to-background border-y border-primary/10">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        {/* Headline */}
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to transform your training?
        </h2>

        {/* Description */}
        <p className="text-xl text-muted-foreground mb-10">
          Join the pioneering medical device companies using Landy AI to drive clinical excellence and business growth.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/20"
            asChild
            data-track="cta-demo"
          >
            <a href="mailto:sales@landy.ai?subject=Book%20a%20Demo&body=Hi%2C%20I%27d%20like%20to%20schedule%20a%20demo%20of%20Landy%20AI.">
              Book a Demo
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-14 px-8 text-lg rounded-full bg-background"
            asChild
            data-track="cta-sales"
          >
            <a href="mailto:sales@landy.ai?subject=Contact%20Sales&body=Hi%2C%20I%27d%20like%20to%20learn%20more%20about%20Landy%20AI.">
              Contact Sales
            </a>
          </Button>
        </div>

        {/* Additional Info */}
        <p className="mt-6 text-sm text-muted-foreground">
          Schedule a personalized demo • Enterprise-ready
        </p>
      </div>
    </section>
  )
}
