import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
})

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const collection = await prisma.collection.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        documents: {
          include: {
            document: true,
          },
        },
      },
    })

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    return NextResponse.json({ collection })
  } catch (error) {
    console.error("Error fetching collection:", error)
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if collection exists and belongs to user
    const existingCollection = await prisma.collection.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingCollection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    const body = await req.json()
    const { name, description, isPublic } = collectionSchema.parse(body)

    const updatedCollection = await prisma.collection.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        isPublic,
      },
    })

    return NextResponse.json({
      collection: updatedCollection,
      message: "Collection updated successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("Error updating collection:", error)
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 })
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

    // Delete collection
    await prisma.collection.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ message: "Collection deleted successfully" })
  } catch (error) {
    console.error("Error deleting collection:", error)
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 })
  }
}
