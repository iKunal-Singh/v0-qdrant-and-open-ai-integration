import { PDFDocument } from "pdf-lib"
import { QdrantClient } from "@/lib/vector-db"
import { createEmbedding } from "@/lib/embeddings"

interface DocumentChunk {
  text: string
  page: number
  section?: string
  keywords?: string[]
  vectorId: string
}

interface ProcessResult {
  documentId: string
  pageCount: number
  chunks: DocumentChunk[]
}

export async function processDocument(file: File, documentId: string): Promise<ProcessResult> {
  // Extract text from document
  const chunks = await extractTextFromDocument(file, documentId)

  // Generate embeddings and store in vector database
  if (QdrantClient) {
    await storeEmbeddings(chunks, documentId)
  }

  return {
    documentId,
    pageCount: Math.max(...chunks.map((chunk) => chunk.page)),
    chunks,
  }
}

async function extractTextFromDocument(file: File, documentId: string): Promise<DocumentChunk[]> {
  const chunks: DocumentChunk[] = []
  const fileExtension = file.name.split(".").pop()?.toLowerCase()

  if (fileExtension === "pdf") {
    // Process PDF
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pageCount = pdfDoc.getPageCount()

    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i)
      const { width, height } = page.getSize()

      // In a real implementation, you would extract text from the PDF
      // For this example, we'll create placeholder text
      const pageNumber = i + 1
      const chunkText = `Content from page ${pageNumber} of document ${file.name}. This page has dimensions ${width}x${height}.`

      chunks.push({
        text: chunkText,
        page: pageNumber,
        section: `Page ${pageNumber}`,
        keywords: extractKeywords(chunkText),
        vectorId: `${documentId}-${pageNumber}`,
      })
    }
  } else if (fileExtension === "docx") {
    // For DOCX, we'd use a library like mammoth.js
    // For this example, we'll create a placeholder chunk
    chunks.push({
      text: `Content from document ${file.name}. This is a DOCX file.`,
      page: 1,
      section: "Document",
      keywords: ["document", "docx"],
      vectorId: `${documentId}-1`,
    })
  }

  return chunks
}

async function storeEmbeddings(chunks: DocumentChunk[], documentId: string): Promise<void> {
  if (!QdrantClient) return

  const points = []

  for (const chunk of chunks) {
    try {
      // Generate embedding for the chunk text
      const embedding = await createEmbedding(chunk.text)

      points.push({
        id: chunk.vectorId,
        vector: embedding,
        payload: {
          text: chunk.text,
          documentId,
          metadata: {
            page: chunk.page,
            section: chunk.section,
            file: documentId,
          },
        },
      })
    } catch (error) {
      console.error(`Error generating embedding for chunk: ${error}`)
    }
  }

  if (points.length > 0) {
    await QdrantClient.upsert("docs", {
      wait: true,
      points,
    })
  }
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction - in production use NLP libraries
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .filter((word) => !isStopWord(word))

  // Count word frequencies
  const wordCounts = words.reduce(
    (acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Get top keywords
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}

function isStopWord(word: string): boolean {
  const stopWords = new Set([
    "the",
    "and",
    "that",
    "have",
    "for",
    "not",
    "with",
    "this",
    "but",
    "from",
    "they",
    "will",
    "would",
    "there",
    "their",
    "what",
    "about",
    "which",
    "when",
    "make",
    "like",
    "time",
    "just",
    "know",
    "take",
    "people",
    "into",
    "year",
    "your",
    "good",
    "some",
    "could",
    "them",
    "than",
    "then",
    "look",
    "only",
    "come",
    "over",
    "think",
    "also",
    "back",
    "after",
    "work",
    "first",
    "well",
    "even",
    "want",
    "because",
    "these",
    "give",
    "most",
  ])
  return stopWords.has(word)
}
