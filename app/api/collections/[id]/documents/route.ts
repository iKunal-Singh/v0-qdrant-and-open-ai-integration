import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const documentIdsSchema = z.object({
  documentIds: z.array(z.string()),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if collection exists and belongs to user
    const collection = await prisma.collection.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    const body = await req.json()
    const { documentIds } = documentIdsSchema.parse(body)

    // Verify all documents exist and belong to user
    const documents = await prisma.document.findMany({
      where: {
        id: {
          in: documentIds,
        },
        userId: session.user.id,
      },
    })

    if (documents.length !== documentIds.length) {
      return NextResponse.json({ error: "One or more documents not found or not owned by user" }, { status: 400 })
    }

    // Add documents to collection
    const documentCollections = []
    for (const documentId of documentIds) {
      // Check if document is already in collection
      const existingDocumentCollection = await prisma.documentCollection.findUnique({
        where: {
          documentId_collectionId: {
            documentId,
            collectionId: params.id,
          },
        },
      })

      if (!existingDocumentCollection) {
        const documentCollection = await prisma.documentCollection.create({
          data: {
            documentId,
            collectionId: params.id,
          },
        })
        documentCollections.push(documentCollection)
      }
    }

    return NextResponse.json({
      message: "Documents added to collection successfully",
      addedCount: documentCollections.length,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("Error adding documents to collection:", error)
    return NextResponse.json({ error: "Failed to add documents to collection" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if collection exists and belongs to user
    const collection = await prisma.collection.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    const body = await req.json()
    const { documentIds } = documentIdsSchema.parse(body)

    // Remove documents from collection
    await prisma.documentCollection.deleteMany({
      where: {
        collectionId: params.id,
        documentId: {
          in: documentIds,
        },
      },
    })

    return NextResponse.json({
      message: "Documents removed from collection successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("Error removing documents from collection:", error)
    return NextResponse.json({ error: "Failed to remove documents from collection" }, { status: 500 })
  }
}
