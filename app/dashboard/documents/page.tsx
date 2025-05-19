import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { DocumentList } from "@/components/documents/document-list"
import { UploadIcon } from "lucide-react"

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const documents = await prisma.document.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display tracking-wide text-text-light dark:text-text-dark">
          YOUR <span className="text-accent-light dark:text-accent-dark">DOCUMENTS</span>
        </h1>
        <Button
          asChild
          className="bg-accent-light dark:bg-accent-dark hover:bg-accent-light/90 dark:hover:bg-accent-dark/90 text-white"
        >
          <Link href="/upload">
            <UploadIcon className="mr-2 h-4 w-4" />
            Upload Document
          </Link>
        </Button>
      </div>

      <DocumentList documents={documents} />
    </div>
  )
}
