import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-red-gradient opacity-90 dark:opacity-80"></div>

      {/* Noise texture */}
      <div className="absolute inset-0 bg-noise-pattern opacity-20"></div>

      <div className="container mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl tracking-wide mb-6 text-white">
            START USING <span className="underline decoration-2 underline-offset-4">AGENT DOC</span> TODAY
          </h2>

          <p className="text-xl mb-8 text-white/90 leading-relaxed">
            Upload your documents and start chatting with them in minutes. No complex setup required.
          </p>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full text-base px-8 bg-transparent border-white text-white hover:bg-white/10"
          >
            <Link href="/upload">Get Started Now</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
