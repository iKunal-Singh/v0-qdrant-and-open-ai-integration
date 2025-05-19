import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const collectionId = searchParams.get("collectionId")

    let documents

    if (collectionId) {
      // Get documents in a specific collection
      documents = await prisma.document.findMany({
        where: {
          collections: {
            some: {
              collectionId,
              collection: {
                userId: session.user.id,
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      })
    } else {
      // Get all user documents
      documents = await prisma.document.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      })
    }

    const total = await prisma.document.count({
      where: {
        userId: session.user.id,
        ...(collectionId
          ? {
              collections: {
                some: {
                  collectionId,
                },
              },
            }
          : {}),
      },
    })

    return NextResponse.json({
      documents,
      pagination: {
        total,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
