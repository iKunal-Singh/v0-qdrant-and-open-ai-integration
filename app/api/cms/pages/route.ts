import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const pageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  content: z.string(),
  isPublished: z.boolean().default(false),
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    const isPublishedOnly = searchParams.get("published") === "true"

    // For public pages, no authentication required
    if (isPublishedOnly) {
      const pages = await prisma.page.findMany({
        where: {
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return NextResponse.json({ pages })
    }

    // For all pages, require admin authentication
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pages = await prisma.page.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ pages })
  } catch (error) {
    console.error("Error fetching pages:", error)
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, slug, content, isPublished } = pageSchema.parse(body)

    // Check if slug already exists
    const existingPage = await prisma.page.findUnique({
      where: {
        slug,
      },
    })

    if (existingPage) {
      return NextResponse.json({ error: "A page with this slug already exists" }, { status: 409 })
    }

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        content,
        isPublished,
      },
    })

    return NextResponse.json({ page, message: "Page created successfully" }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("Error creating page:", error)
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 })
  }
}
