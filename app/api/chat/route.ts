import { AIStream, streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { QdrantClient } from "@/lib/vector-db"
import { createEmbedding } from "@/lib/embeddings"
import { z } from "zod"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages, documentId, collectionId } = await req.json()

    if (!messages || !messages.length) {
      return Response.json({ error: "No messages provided" }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    const query = lastMessage.content

    // Generate embedding for the query
    let queryEmbedding: number[] = []
    try {
      queryEmbedding = await createEmbedding(query)
    } catch (embeddingError) {
      console.error("Error generating query embedding:", embeddingError)
      // Fall back to random embedding (not for production)
      queryEmbedding = Array(1536)
        .fill(0)
        .map(() => Math.random() * 2 - 1)
    }

    // Retrieve relevant document chunks
    let relevantChunks = []

    try {
      if (QdrantClient) {
        // If a specific document is provided, search only within that document
        if (documentId) {
          // Verify document belongs to user
          const document = await prisma.document.findUnique({
            where: {
              id: documentId,
              userId: session.user.id,
            },
          })

          if (!document) {
            return Response.json({ error: "Document not found" }, { status: 404 })
          }

          // Search for relevant chunks in the document
          const { results } = await QdrantClient.search("docs", {
            vector: queryEmbedding,
            filter: {
              must: [
                {
                  key: "documentId",
                  match: { value: documentId },
                },
              ],
            },
            limit: 5,
          })

          relevantChunks = results.map((result) => ({
            id: result.id,
            text: result.payload.text,
            metadata: {
              documentId: result.payload.documentId,
              page: result.payload.metadata.page,
              title: result.payload.metadata.title || "Document",
              file: result.payload.metadata.file || "document.pdf",
            },
          }))
        }
        // If a collection is provided, search within that collection
        else if (collectionId) {
          // Verify collection belongs to user
          const collection = await prisma.collection.findUnique({
            where: {
              id: collectionId,
              userId: session.user.id,
            },
            include: {
              documents: {
                select: {
                  documentId: true,
                },
              },
            },
          })

          if (!collection) {
            return Response.json({ error: "Collection not found" }, { status: 404 })
          }

          const documentIds = collection.documents.map((doc) => doc.documentId)

          if (documentIds.length > 0) {
            // Search for relevant chunks in the collection documents
            const { results } = await QdrantClient.search("docs", {
              vector: queryEmbedding,
              filter: {
                must: [
                  {
                    key: "documentId",
                    any: documentIds.map((id) => ({ match: { value: id } })),
                  },
                ],
              },
              limit: 5,
            })

            relevantChunks = results.map((result) => ({
              id: result.id,
              text: result.payload.text,
              metadata: {
                documentId: result.payload.documentId,
                page: result.payload.metadata.page,
                title: result.payload.metadata.title || "Document",
                file: result.payload.metadata.file || "document.pdf",
              },
            }))
          }
        }
        // Otherwise, search across all user documents
        else {
          // Get all user document IDs
          const userDocuments = await prisma.document.findMany({
            where: {
              userId: session.user.id,
            },
            select: {
              id: true,
            },
          })

          const documentIds = userDocuments.map((doc) => doc.id)

          if (documentIds.length > 0) {
            // Search for relevant chunks in all user documents
            const { results } = await QdrantClient.search("docs", {
              vector: queryEmbedding,
              filter: {
                must: [
                  {
                    key: "documentId",
                    any: documentIds.map((id) => ({ match: { value: id } })),
                  },
                ],
              },
              limit: 5,
            })

            relevantChunks = results.map((result) => ({
              id: result.id,
              text: result.payload.text,
              metadata: {
                documentId: result.payload.documentId,
                page: result.payload.metadata.page,
                title: result.payload.metadata.title || "Document",
                file: result.payload.metadata.file || "document.pdf",
              },
            }))
          }
        }
      }
    } catch (searchError) {
      console.error("Error searching for relevant chunks:", searchError)
      // Continue with empty chunks if search fails
    }

    // If no relevant chunks found, fall back to database
    if (relevantChunks.length === 0) {
      try {
        // Get chunks from database based on the same filtering logic
        let chunks = []

        if (documentId) {
          chunks = await prisma.documentChunk.findMany({
            where: {
              documentId,
              document: {
                userId: session.user.id,
              },
            },
            take: 5,
          })
        } else if (collectionId) {
          const collection = await prisma.collection.findUnique({
            where: {
              id: collectionId,
              userId: session.user.id,
            },
            include: {
              documents: {
                select: {
                  documentId: true,
                },
              },
            },
          })

          if (collection) {
            const documentIds = collection.documents.map((doc) => doc.documentId)

            if (documentIds.length > 0) {
              chunks = await prisma.documentChunk.findMany({
                where: {
                  documentId: {
                    in: documentIds,
                  },
                },
                take: 5,
              })
            }
          }
        } else {
          chunks = await prisma.documentChunk.findMany({
            where: {
              document: {
                userId: session.user.id,
              },
            },
            take: 5,
          })
        }

        relevantChunks = chunks.map((chunk) => ({
          id: chunk.id,
          text: chunk.text,
          metadata: {
            documentId: chunk.documentId,
            page: chunk.page || 1,
            title: "Document",
            file: "document.pdf",
          },
        }))
      } catch (dbError) {
        console.error("Error fetching chunks from database:", dbError)
      }
    }

    // If still no chunks, use mock data
    if (relevantChunks.length === 0) {
      relevantChunks = [
        {
          id: "mock-1",
          text: "This is a sample document chunk that demonstrates how Agent DOC works. It provides information about documents that have been uploaded to the system.",
          metadata: {
            documentId: "mock-doc-1",
            page: 1,
            title: "Sample Document",
            file: "Sample Document.pdf",
          },
        },
        {
          id: "mock-2",
          text: "Agent DOC is a document retrieval system that uses AI to answer questions about your documents. It can process PDF files and extract relevant information.",
          metadata: {
            documentId: "mock-doc-2",
            page: 1,
            title: "Agent DOC Guide",
            file: "Agent DOC Guide.pdf",
          },
        },
      ]
    }

    console.log("Generating response with context...")

    try {
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key is not configured")
      }

      // Prepare context from relevant chunks
      const context = relevantChunks
        .map(
          (chunk, index) =>
            `[source${index + 1}] ${chunk.text} (From: ${chunk.metadata.title}, Page ${chunk.metadata.page})`,
        )
        .join("\n\n")

      // Save chat history
      const chatHistory = await prisma.chatHistory.create({
        data: {
          userId: session.user.id,
          documentId: documentId || null,
          collectionId: collectionId || null,
          query,
        },
      })

      // Generation with Source Citations
      const response = await streamText({
        model: openai("gpt-4o"),
        system: `You are a helpful assistant that answers questions based on the provided document excerpts.
        
Answer using ONLY information from these excerpts and cite your sources using [source#] notation.
If the information needed is not in the excerpts, say "I don't have enough information about that."

Document excerpts:
${context}`,
        messages,
        temperature: 0.2,
        tools: {
          documentPreview: {
            description: "Show original document context",
            parameters: z.object({
              sourceId: z.number().int().min(1).max(relevantChunks.length),
            }),
            execute: async ({ sourceId }) => {
              const index = sourceId - 1
              if (index >= 0 && index < relevantChunks.length) {
                return {
                  id: relevantChunks[index].id,
                  text: relevantChunks[index].text,
                  file: relevantChunks[index].metadata.file,
                  page: relevantChunks[index].metadata.page,
                  title: relevantChunks[index].metadata.title,
                }
              }
              throw new Error(`Invalid source ID: ${sourceId}`)
            },
          },
        },
      })

      // Save the response to chat history
      response.text.then(async (fullText) => {
        await prisma.chatMessage.createMany({
          data: [
            {
              chatHistoryId: chatHistory.id,
              role: "user",
              content: query,
            },
            {
              chatHistoryId: chatHistory.id,
              role: "assistant",
              content: fullText,
            },
          ],
        })
      })

      return AIStream(response)
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
    console.error("Chat API error:", error)
    return Response.json({ error: "Failed to process request" }, { status: 500 })
  }
}
