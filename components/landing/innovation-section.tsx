import { Rocket, Award, Target } from "lucide-react"

export function InnovationSection() {
  const innovations = [
    {
      icon: Rocket,
      title: "First-Mover Advantage",
      description: "Built from the ground up for the AI era, not retrofitted onto legacy systems"
    },
    {
      icon: Award,
      title: "Expert-Built",
      description: "Built by doctors, surgeons, and medical device specialists who understand MedTech"
    },
    {
      icon: Target,
      title: "Enterprise-Ready",
      description: "Powered by AWS Bedrock & Claude AI with enterprise-grade security"
    }
  ]

  return (
    <section className="py-24 bg-background border-y border-border/40">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <Rocket className="h-6 w-6 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Innovation Leader
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            The First AI-Native L&D Platform for MedTech
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-12">
            Pioneering the future of medical device training with cutting-edge AI technology
          </p>

          {/* Innovation Cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {innovations.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="space-y-3">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
