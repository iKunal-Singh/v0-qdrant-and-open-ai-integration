import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { ChatInterface } from "@/components/chat/chat-interface"

export default async function ChatPage({
  searchParams,
}: {
  searchParams: { documentId?: string; collectionId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const { documentId, collectionId } = searchParams

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-2 text-text-light dark:text-text-dark">
            CHAT WITH <span className="text-accent-light dark:text-accent-dark">DOCUMENTS</span>
          </h1>
          <p className="text-text-light/70 dark:text-text-dark/70 text-lg">
            Ask questions about your {documentId ? "document" : collectionId ? "collection" : "uploaded documents"} and
            get instant answers
          </p>
        </header>

        <ChatInterface documentId={documentId} collectionId={collectionId} />
      </div>
    </div>
  )
}
