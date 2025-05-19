import { QdrantClient } from "@/lib/vector-db"

type DocumentReference = {
  sourceDocumentId: string
  targetDocumentId: string
  sourceChunkId: string
  targetChunkId: string
  relationshipType: "cites" | "refutes" | "supports" | "related"
  confidence: number
}

export async function findRelatedDocuments(documentId: string): Promise<DocumentReference[]> {
  try {
    // Get all chunks for this document
    const { points: documentChunks } = await QdrantClient.scroll("docs", {
      filter: {
        must: [{ key: "documentId", match: { value: documentId } }],
      },
      with_payload: true,
      with_vectors: true,
      limit: 100,
    })

    // Find potential references by semantic similarity
    const references: DocumentReference[] = []

    for (const chunk of documentChunks) {
      // Search for similar chunks in other documents
      const { results } = await QdrantClient.search("docs", {
        vector: chunk.vector,
        filter: {
          must_not: [{ key: "documentId", match: { value: documentId } }],
        },
        limit: 5,
      })

      // For each similar chunk, determine the relationship type
      for (const result of results) {
        if (result.score > 0.8) {
          // Only consider high similarity matches
          // In a real implementation, you would use an LLM to classify the relationship
          references.push({
            sourceDocumentId: documentId,
            targetDocumentId: result.payload.documentId,
            sourceChunkId: chunk.id,
            targetChunkId: result.id,
            relationshipType: "related", // Default relationship type
            confidence: result.score,
          })
        }
      }
    }

    return references
  } catch (error) {
    console.error("Error finding related documents:", error)
    throw error
  }
}
