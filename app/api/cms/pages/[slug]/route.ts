import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const pageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string(),
  isPublished: z.boolean().default(false),
})

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const page = await prisma.page.findUnique({
      where: {
        slug: params.slug,
      },
    })

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    // If page is not published, require admin authentication
    if (!page.isPublished) {
      const session = await getServerSession(authOptions)

      if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error("Error fetching page:", error)
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: {
        slug: params.slug,
      },
    })

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    const body = await req.json()
    const { title, content, isPublished } = pageSchema.parse(body)

    const updatedPage = await prisma.page.update({
      where: {
        slug: params.slug,
      },
      data: {
        title,
        content,
        isPublished,
      },
    })

    return NextResponse.json({
      page: updatedPage,
      message: "Page updated successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("Error updating page:", error)
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if page exists
    const page = await prisma.page.findUnique({
      where: {
        slug: params.slug,
      },
    })

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    // Delete page
    await prisma.page.delete({
      where: {
        slug: params.slug,
      },
    })

    return NextResponse.json({ message: "Page deleted successfully" })
  } catch (error) {
    console.error("Error deleting page:", error)
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 })
  }
}
