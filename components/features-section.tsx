import { FileText, MessageSquare, Search, Shield } from "lucide-react"

const features = [
  {
    icon: <FileText className="h-10 w-10 text-accent-light dark:text-accent-dark" />,
    title: "Document Processing",
    description: "Upload and process PDF documents with advanced text extraction and embedding generation.",
  },
  {
    icon: <Search className="h-10 w-10 text-accent-light dark:text-accent-dark" />,
    title: "Semantic Search",
    description: "Find information across your documents using natural language queries and semantic understanding.",
  },
  {
    icon: <MessageSquare className="h-10 w-10 text-accent-light dark:text-accent-dark" />,
    title: "Interactive Chat",
    description: "Chat with your documents using a conversational interface powered by advanced AI models.",
  },
  {
    icon: <Shield className="h-10 w-10 text-accent-light dark:text-accent-dark" />,
    title: "Secure Storage",
    description: "Your documents are stored securely and processed with privacy-preserving techniques.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 bg-secondary-light dark:bg-secondary-dark relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-geometric-pattern opacity-5 dark:opacity-10"></div>

      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl tracking-wide mb-4 text-text-light dark:text-text-dark">
            POWERFUL <span className="text-accent-light dark:text-accent-dark">FEATURES</span>
          </h2>
          <p className="text-lg text-text-light/80 dark:text-text-dark/80 max-w-2xl mx-auto">
            Discover how Agent DOC can transform the way you interact with your documents
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-primary-light dark:bg-primary-dark rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="mb-5">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-text-light dark:text-text-dark">{feature.title}</h3>
              <p className="text-text-light/80 dark:text-text-dark/80">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
