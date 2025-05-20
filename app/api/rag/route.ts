import { StreamingTextResponse, streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]

    if (!lastMessage?.content) {
      return Response.json({ error: "No message content provided" }, { status: 400 })
    }

    console.log("Processing query:", lastMessage.content)

    // Mock document chunks for demonstration
    const mockChunks = [
      {
        id: "mock-1",
        payload: {
          text: "This is a sample document chunk that demonstrates how Agent DOC works. It provides information about documents that have been uploaded to the system.",
          file: "Sample Document.pdf",
          page: 1,
          title: "Sample Document",
        },
      },
      {
        id: "mock-2",
        payload: {
          text: "Agent DOC is a document retrieval system that uses AI to answer questions about your documents. It can process PDF files and extract relevant information.",
          file: "Agent DOC Guide.pdf",
          page: 1,
          title: "Agent DOC Guide",
        },
      },
    ]

    console.log("Generating response with context...")

    try {
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key is not configured")
      }

      // Generation with Source Citations
      const response = await streamText({
        model: openai("gpt-4o"),
        system: `You are a helpful assistant that answers questions based on the provided document excerpts.
        
Answer using ONLY information from these excerpts and cite your sources using [source#] notation.
If the information needed is not in the excerpts, say "I don't have enough information about that."

Document excerpts:
[source1] ${mockChunks[0].payload.text}
[source2] ${mockChunks[1].payload.text}`,
        messages,
        temperature: 0.2,
        tools: {
          documentPreview: {
            description: "Show original document context",
            parameters: z.object({
              sourceId: z.number().int().min(1).max(mockChunks.length),
            }),
            execute: async ({ sourceId }) => {
              const index = sourceId - 1
              if (index >= 0 && index < mockChunks.length) {
                return {
                  id: mockChunks[index].id,
                  text: mockChunks[index].payload.text,
                  file: mockChunks[index].payload.file,
                  page: mockChunks[index].payload.page,
                  title: mockChunks[index].payload.title,
                }
              }
              throw new Error(`Invalid source ID: ${sourceId}`)
            },
          },
        },
      })

      // Use StreamingTextResponse instead of AIStream
      return new StreamingTextResponse(response.stream)
    } catch (aiError) {
      console.error("Error generating AI response:", aiError)

      // Return a simple error response
      return Response.json(
        {
          error: "Failed to generate response",
          details: aiError instanceof Error ? aiError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("RAG API error:", error)
    return Response.json({ error: "Failed to process request" }, { status: 500 })
  }
}
