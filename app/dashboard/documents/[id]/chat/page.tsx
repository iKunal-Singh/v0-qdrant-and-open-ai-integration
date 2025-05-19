import { getServerSession } from "next-auth/next"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ChatInterface } from "@/components/chat/chat-interface"
import { ArrowLeftIcon } from "lucide-react"

export default async function DocumentChatPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Verify document exists and belongs to user
  const document = await prisma.document.findUnique({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  })

  if (!document) {
    notFound()
  }

  // Get recent chat history for this document
  const chatHistory = await prisma.chatHistory.findFirst({
    where: {
      userId: session.user.id,
      documentId: params.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })

  // Format messages for the chat interface
  const initialMessages = chatHistory
    ? chatHistory.messages.map((message) => ({
        role: message.role,
        content: message.content,
      }))
    : []

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-8">
          <Button asChild variant="ghost" size="sm" className="mr-4">
            <Link href={`/dashboard/documents/${params.id}`}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Document
            </Link>
          </Button>
          <h1 className="text-2xl font-display tracking-wide text-text-light dark:text-text-dark">
            CHAT WITH <span className="text-accent-light dark:text-accent-dark">{document.title}</span>
          </h1>
        </div>

        <ChatInterface documentId={params.id} initialMessages={initialMessages} />
      </div>
    </div>
  )
}
