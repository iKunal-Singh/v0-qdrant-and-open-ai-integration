import Link from "next/link"
import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-secondary-light dark:bg-secondary-dark py-12 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-xl mb-4 text-text-light dark:text-text-dark">
              AGENT<span className="text-accent-light dark:text-accent-dark">DOC</span>
            </h3>
            <p className="text-text-light/80 dark:text-text-dark/80 max-w-md">
              Intelligent document search and retrieval powered by AI. Upload your documents and chat with them.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-lg mb-4 text-text-light dark:text-text-dark">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-text-light/80 dark:text-text-dark/80 hover:text-accent-light dark:hover:text-accent-dark transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/chat"
                  className="text-text-light/80 dark:text-text-dark/80 hover:text-accent-light dark:hover:text-accent-dark transition-colors"
                >
                  Chat with Documents
                </Link>
              </li>
              <li>
                <Link
                  href="/upload"
                  className="text-text-light/80 dark:text-text-dark/80 hover:text-accent-light dark:hover:text-accent-dark transition-colors"
                >
                  Upload Documents
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-lg mb-4 text-text-light dark:text-text-dark">Connect</h4>
            <div className="flex items-center gap-4">
              <Link
                href="https://github.com/yourusername/agent-doc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-light/80 dark:text-text-dark/80 hover:text-accent-light dark:hover:text-accent-dark transition-colors"
              >
                <Github className="h-6 w-6" />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-text-light/60 dark:text-text-dark/60">
          <p>© {new Date().getFullYear()} Agent DOC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
