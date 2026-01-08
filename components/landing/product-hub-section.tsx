import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Database, CheckCircle2, ArrowRight, FileText } from "lucide-react"

export function ProductHubSection() {
  return (
    <section id="products" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
          {/* Content Column */}
          <div className="flex-1 space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-900/20 px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400">
              <Database className="mr-2 h-3.5 w-3.5" />
              Product Hub
            </div>

            {/* Headline */}
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              One platform for your entire portfolio.
            </h2>

            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-xl">
              Centralize 50+ medical devices in one intelligent hub. Empower sales and clinical teams with instant access to the latest product information, training materials, and documentation.
            </p>

            {/* Feature List */}
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

            {/* CTA Button */}
            <Button size="lg" variant="outline" className="mt-4" asChild data-track="product-hub-cta">
              <Link href="/dashboard/products">
                Explore Product Hub
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Visual Column - Product Cards Mockup */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="relative rounded-2xl border border-border bg-background shadow-2xl p-2">
              <div className="rounded-xl bg-muted aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/5 to-pink-500/5 p-8">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    {/* Product Card 1 */}
                    <div className="bg-background rounded-lg shadow-sm border border-border/50 p-4 flex flex-col gap-2">
                      <div className="h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-md w-full mb-2 flex items-center justify-center">
                        <Database className="h-12 w-12 text-primary/30" />
                      </div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                      <div className="h-2 bg-muted rounded w-1/2"></div>
                    </div>

                    {/* Product Card 2 */}
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
  )
}
