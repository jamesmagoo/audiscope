import { MessageSquareText, Database, TrendingUp, Shield } from "lucide-react"

export function FeaturesGrid() {
  const features = [
    {
      icon: MessageSquareText,
      title: "Instant AI Answers",
      description: "Get answers from 1000+ page IFUs instantly. Stop searching through PDFs and ask Landy for specs, contraindications, and clinical data."
    },
    {
      icon: Database,
      title: "Centralized Product Hub",
      description: "One platform for your entire portfolio. All product documentation, IFUs, and training assets in a single, searchable hub."
    },
    {
      icon: TrendingUp,
      title: "Actionable Analytics",
      description: "Track proficiency gaps, monitor training progress, and certify field teams faster with data-driven insights."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade encryption and role-based access control ensure your proprietary data and training materials remain secure."
    }
  ]

  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Everything you need to scale excellence
          </h2>
          <p className="text-lg text-muted-foreground">
            From product launch to clinical mastery, our integrated platform bridges the gap between technical knowledge and field application.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1 text-center"
                data-track={`feature-${index}`}
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
