"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

// Get all documents for the current user
export async function getUserDocuments() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  try {
    const documents = await prisma.document.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, documents }
  } catch (error) {
    console.error("Error fetching documents:", error)
    return { success: false, error: "Failed to fetch documents" }
  }
}

// Create a new collection
export async function createCollection(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const isPublic = formData.get("isPublic") === "true"

  try {
    // Validate input
    if (!name || name.trim() === "") {
      return { success: false, error: "Collection name is required" }
    }

    // Create collection
    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        isPublic,
        userId: session.user.id,
      },
    })

    revalidatePath("/dashboard/collections")
    return { success: true, collection }
  } catch (error) {
    console.error("Error creating collection:", error)
    return { success: false, error: "Failed to create collection" }
  }
}

// Add documents to a collection
export async function addDocumentsToCollection(collectionId: string, documentIds: string[]) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  try {
    // Verify collection belongs to user
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
        userId: session.user.id,
      },
    })

    if (!collection) {
      return { success: false, error: "Collection not found" }
    }

    // Add documents to collection
    const results = await Promise.all(
      documentIds.map(async (documentId) => {
        // Check if document is already in collection
        const existing = await prisma.documentCollection.findUnique({
          where: {
            documentId_collectionId: {
              documentId,
              collectionId,
            },
          },
        })

        if (!existing) {
          return prisma.documentCollection.create({
            data: {
              documentId,
              collectionId,
            },
          })
        }
        return null
      }),
    )

    const addedCount = results.filter(Boolean).length

    revalidatePath(`/dashboard/collections/${collectionId}`)
    return { success: true, addedCount }
  } catch (error) {
    console.error("Error adding documents to collection:", error)
    return { success: false, error: "Failed to add documents to collection" }
  }
}

// Delete a document
export async function deleteDocument(documentId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  try {
    // Verify document belongs to user
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        userId: session.user.id,
      },
    })

    if (!document) {
      return { success: false, error: "Document not found" }
    }

    // Delete document
    await prisma.document.delete({
      where: {
        id: documentId,
      },
    })

    revalidatePath("/dashboard/documents")
    return { success: true, message: "Document deleted successfully" }
  } catch (error) {
    console.error("Error deleting document:", error)
    return { success: false, error: "Failed to delete document" }
  }
}
