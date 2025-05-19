import type { DocumentChunk } from "@/lib/vector-db"

// In-memory storage for documents when Qdrant is not available
const documentStore: Record<
  string,
  {
    chunks: DocumentChunk[]
    metadata: { title?: string; pageCount: number }
  }
> = {}

export async function storeMockDocument(file: File): Promise<{
  documentId: string
  chunkCount: number
}> {
  // Generate a unique document ID
  const documentId = `mock-${file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "-")}-${Date.now()}`

  // Create a simple mock chunk
  const chunks: DocumentChunk[] = [
    {
      text: `This is a mock representation of ${file.name}. In a production environment, this would contain actual content from the document.`,
      keywords: ["mock", "document", "pdf"],
      metadata: {
        page: 1,
        file: file.name,
        title: file.name,
        section: "Document",
      },
    },
  ]

  // Store the document
  documentStore[documentId] = {
    chunks,
    metadata: {
      title: file.name,
      pageCount: 1,
    },
  }

  console.log(`Stored mock document with ID ${documentId}`)

  return {
    documentId,
    chunkCount: chunks.length,
  }
}

export async function getMockDocumentById(documentId: string) {
  const document = documentStore[documentId]
  if (!document) {
    return []
  }

  return document.chunks.map((chunk, index) => ({
    id: `${documentId}-${index}`,
    payload: {
      ...chunk,
      documentId,
    },
  }))
}

export async function deleteMockDocument(documentId: string) {
  if (documentStore[documentId]) {
    delete documentStore[documentId]
    return { deleted: 1 }
  }

  return { deleted: 0 }
}
