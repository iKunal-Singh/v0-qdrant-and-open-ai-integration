import { QdrantClient as Qdrant } from "@qdrant/js-client-rest"

// Define the DocumentChunk type
export type DocumentChunk = {
  text: string
  keywords: string[]
  metadata: {
    page: number
    file: string
    title?: string
    section: string
  }
}

// Check for required environment variables
const QDRANT_URL = process.env.QDRANT_URL
const QDRANT_KEY = process.env.QDRANT_KEY
const COLLECTION_NAME = "docs"

// Create a singleton client with proper error handling
let QdrantClient: Qdrant | null = null

try {
  if (!QDRANT_URL || !QDRANT_KEY) {
    console.warn("Missing required environment variables: QDRANT_URL and/or QDRANT_KEY. Qdrant will be disabled.")
    QdrantClient = null
  } else {
    QdrantClient = new Qdrant({
      url: QDRANT_URL,
      apiKey: QDRANT_KEY,
      timeout: 30000, // 30 second timeout for requests
    })
    console.log("Qdrant client initialized successfully")
  }
} catch (error) {
  console.error("Failed to initialize Qdrant client:", error)
  QdrantClient = null
}

export { QdrantClient }

export async function ensureCollectionExists() {
  if (!QdrantClient) {
    console.warn("Qdrant client is not initialized. Skipping collection creation.")
    return
  }

  try {
    const collections = await QdrantClient.getCollections()
    const collectionExists = collections.collections.some((c) => c.name === COLLECTION_NAME)

    if (!collectionExists) {
      console.log(`Collection "${COLLECTION_NAME}" does not exist. Creating...`)
      await QdrantClient.createCollection(COLLECTION_NAME, {
        vectors_config: {
          distance: "Cosine",
          size: 1536,
        },
      })
      console.log(`Collection "${COLLECTION_NAME}" created successfully.`)
    } else {
      console.log(`Collection "${COLLECTION_NAME}" already exists.`)
    }
  } catch (error) {
    console.error("Error ensuring collection exists:", error)
    throw error
  }
}

export async function ingestDocument(file: File): Promise<{
  documentId: string
  chunkCount: number
}> {
  if (!QdrantClient) {
    throw new Error("Qdrant client is not initialized. Cannot ingest document.")
  }

  const { PDFLoader } = await import("@/lib/pdf-loader")
  const loader = new PDFLoader(file)
  const { chunks, metadata } = await loader.process()

  const documentId = `doc-${file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "-")}-${Date.now()}`

  try {
    const points = chunks.map((chunk, index) => ({
      id: `${documentId}-${index}`,
      vector: Array(1536).fill(Math.random()), // Replace with actual embeddings
      payload: {
        ...chunk,
        documentId,
      },
    }))

    await QdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    })

    console.log(`Successfully ingested document "${file.name}" into Qdrant.`)

    return {
      documentId,
      chunkCount: chunks.length,
    }
  } catch (error) {
    console.error("Error ingesting document:", error)
    throw error
  }
}

// Add the missing searchVectorDB function
export async function searchVectorDB(query: string, limit = 5) {
  if (!QdrantClient) {
    console.warn("Qdrant client is not initialized. Cannot search vector DB.")
    return []
  }

  try {
    // For now, we'll use a mock vector for the query
    // In a real implementation, you would generate embeddings for the query
    const mockQueryVector = Array(1536).fill(Math.random())

    const searchResults = await QdrantClient.search(COLLECTION_NAME, {
      vector: mockQueryVector,
      limit: limit,
      with_payload: true,
    })

    return searchResults.map((result) => ({
      score: result.score,
      chunk: result.payload as DocumentChunk,
    }))
  } catch (error) {
    console.error("Error searching vector DB:", error)
    throw error
  }
}
