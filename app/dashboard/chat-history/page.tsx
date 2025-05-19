import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquareIcon } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function ChatHistoryPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Get chat history
  const chatHistory = await prisma.chatHistory.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      document: {
        select: {
          title: true,
        },
      },
      collection: {
        select: {
          name: true,
        },
      },
      messages: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    take: 20,
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display tracking-wide text-text-light dark:text-text-dark">
          CHAT <span className="text-accent-light dark:text-accent-dark">HISTORY</span>
        </h1>
        <Button
          asChild
          className="bg-accent-light dark:bg-accent-dark hover:bg-accent-light/90 dark:hover:bg-accent-dark/90 text-white"
        >
          <Link href="/chat">
            <MessageSquareIcon className="mr-2 h-4 w-4" />
            New Chat
          </Link>
        </Button>
      </div>

      {chatHistory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquareIcon className="h-12 w-12 text-text-light/40 dark:text-text-dark/40 mb-4" />
            <h3 className="text-xl font-medium mb-2 text-text-light dark:text-text-dark">No chat history yet</h3>
            <p className="text-text-light/60 dark:text-text-dark/60 mb-6 text-center">
              Start a conversation with your documents to see your chat history here.
            </p>
            <Button asChild className="bg-accent-light dark:bg-accent-dark">
              <Link href="/chat">Start Chatting</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {chatHistory.map((chat) => (
            <Card key={chat.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-medium truncate">{chat.query}</CardTitle>
                    <CardDescription>
                      {chat.document
                        ? `Document: ${chat.document.title}`
                        : chat.collection
                          ? `Collection: ${chat.collection.name}`
                          : "All Documents"}
                    </CardDescription>
                  </div>
                  <span className="text-xs text-text-light/60 dark:text-text-dark/60">
                    {formatDate(chat.createdAt)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                {chat.messages.length > 0 && (
                  <div className="text-sm text-text-light/80 dark:text-text-dark/80 line-clamp-2">
                    {chat.messages[0].content}
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <Button asChild variant="outline" size="sm" className="text-xs rounded-full">
                    <Link
                      href={
                        chat.documentId
                          ? `/chat?documentId=${chat.documentId}`
                          : chat.collectionId
                            ? `/chat?collectionId=${chat.collectionId}`
                            : "/chat"
                      }
                    >
                      Continue Chat
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
