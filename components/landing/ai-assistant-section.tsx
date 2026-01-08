import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, CheckCircle2, ArrowRight, Brain, FileText } from "lucide-react"

export function AIAssistantSection() {
  return (
    <section id="assistant" className="py-24 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Content Column */}
          <div className="flex-1 space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              AI Product Assistant
            </div>

            {/* Headline */}
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Ask 1000+ page IFUs. Get answers in seconds.
            </h2>

            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-xl">
              Your teams shouldn't have to memorize every page of every IFU. Landy AI digests your technical documents and videos to provide instant, cited answers to any product question.
            </p>

            {/* Feature List */}
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

            {/* CTA Button */}
            <Button size="lg" className="mt-4" asChild data-track="ai-assistant-cta">
              <Link href="/dashboard">
                Try the Assistant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Visual Column - Chat UI Mockup */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="relative rounded-2xl border border-border bg-background shadow-2xl p-2">
              <div className="rounded-xl bg-muted aspect-square flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-cyan-500/5 flex flex-col p-6">
                  {/* Chat Messages */}
                  <div className="flex-1 space-y-6 overflow-hidden">
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-5 py-3 text-sm shadow-md max-w-[85%]">
                        What are the contraindications for the pediatric valve?
                      </div>
                    </div>

                    {/* AI Response */}
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

                    {/* Second User Message (Faded) */}
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
  )
}
