import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { DocumentUploadForm } from "@/components/documents/document-upload-form"

export default async function UploadPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Get user collections
  const collections = await prisma.collection.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-2 text-text-light dark:text-text-dark">
            UPLOAD <span className="text-accent-light dark:text-accent-dark">DOCUMENTS</span>
          </h1>
          <p className="text-text-light/70 dark:text-text-dark/70 text-lg">
            Upload your PDF or DOCX documents to chat with them later
          </p>
        </header>

        <DocumentUploadForm collections={collections} />
      </div>
    </div>
  )
}
