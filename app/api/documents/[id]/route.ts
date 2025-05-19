import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const document = await prisma.document.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        collections: {
          include: {
            collection: true,
          },
        },
        chunks: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if document exists and belongs to user
    const document = await prisma.document.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete document from Qdrant
    const { QdrantClient } = await import("@/lib/vector-db")

    if (QdrantClient) {
      try {
        // Delete points with IDs that start with the document ID
        const points = await QdrantClient.scroll("docs", {
          filter: {
            must: [
              {
                key: "documentId",
                match: { value: params.id },
              },
            ],
          },
          with_payload: false,
          limit: 100,
        })

        if (points.points.length > 0) {
          const pointIds = points.points.map((point) => point.id)
          await QdrantClient.delete("docs", {
            points: pointIds,
          })
        }
      } catch (qdrantError) {
        console.error("Error deleting document from Qdrant:", qdrantError)
        // Continue with database deletion even if Qdrant deletion fails
      }
    }

    // Delete document from database
    await prisma.document.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
