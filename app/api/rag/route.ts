import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { searchVectorDB } from "@/lib/vector-db"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { messages, documentId } = await req.json()
    const userQuery = messages[messages.length - 1].content

    // Get document context from vector DB
    const searchResults = await searchVectorDB(userQuery, documentId)

    // Create context from search results
    const context = searchResults.map((result) => result.text).join("\n\n")

    // Create system message with context
    const systemMessage = `You are a helpful assistant that answers questions based on the provided document context. 
    Use the following context to answer the user's question. If you cannot find the answer in the context, 
    say that you don't have enough information to answer accurately.
    
    Context:
    ${context}`

    // Save chat history
    const chatHistory = await prisma.chatHistory.create({
      data: {
        userId: session.user.id as string,
        documentId: documentId,
        query: userQuery,
        messages: {
          create: [
            ...messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
            })),
          ],
        },
      },
    })

    // Prepare messages for the AI
    const aiMessages = [{ role: "system", content: systemMessage }, ...messages]

    const response = await streamText({
      model: openai("gpt-4o"),
      messages: aiMessages,
    })

    return new Response(response.stream)
  } catch (error) {
    console.error("RAG API error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
