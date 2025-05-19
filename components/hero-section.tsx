import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-dots-pattern opacity-5 dark:opacity-10"></div>

      {/* Red Accent */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-light dark:bg-accent-dark rounded-full blur-3xl opacity-20 animate-pulse-slow"></div>

      <div className="container mx-auto py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="font-display text-5xl md:text-7xl tracking-wider mb-6 text-text-light dark:text-text-dark">
            AGENT<span className="text-accent-light dark:text-accent-dark">DOC</span>
          </h1>

          <p className="text-xl md:text-2xl mb-8 text-text-light/80 dark:text-text-dark/80 leading-relaxed">
            Intelligent document search and retrieval powered by AI. Upload your documents and chat with them.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="rounded-full text-base px-8">
              <Link href="/chat">
                Start Chatting
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="rounded-full text-base px-8">
              <Link href="/upload">Upload Documents</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
