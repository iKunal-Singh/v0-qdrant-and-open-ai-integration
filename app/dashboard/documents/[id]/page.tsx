import { getServerSession } from "next-auth/next"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeftIcon, MessageSquareIcon } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { DeleteDocumentButton } from "@/components/documents/delete-document-button"

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Verify document exists and belongs to user
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
      chunks: {
        take: 5,
      },
    },
  })

  if (!document) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button asChild variant="ghost" size="sm" className="mr-4">
            <Link href="/dashboard/documents">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Documents
            </Link>
          </Button>
          <h1 className="text-3xl font-display tracking-wide text-text-light dark:text-text-dark">
            <span className="text-accent-light dark:text-accent-dark">{document.title}</span>
          </h1>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/documents/${params.id}/chat`}>
              <MessageSquareIcon className="mr-2 h-4 w-4" />
              Chat with Document
            </Link>
          </Button>
          <DeleteDocumentButton documentId={document.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
            <CardDescription>Details about this document</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-text-light/70 dark:text-text-dark/70">File Name</dt>
                <dd className="mt-1">{document.fileName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-text-light/70 dark:text-text-dark/70">File Size</dt>
                <dd className="mt-1">{(document.fileSize / 1024 / 1024).toFixed(2)} MB</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-text-light/70 dark:text-text-dark/70">File Type</dt>
                <dd className="mt-1">{document.fileType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-text-light/70 dark:text-text-dark/70">Pages</dt>
                <dd className="mt-1">{document.pageCount || "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-text-light/70 dark:text-text-dark/70">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs ${
                      document.status === "COMPLETED"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : document.status === "PROCESSING"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {document.status === "COMPLETED"
                      ? "Processed"
                      : document.status === "PROCESSING"
                        ? "Processing"
                        : "Failed"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-text-light/70 dark:text-text-dark/70">Uploaded</dt>
                <dd className="mt-1">{formatDate(document.createdAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collections</CardTitle>
            <CardDescription>Collections this document belongs to</CardDescription>
          </CardHeader>
          <CardContent>
            {document.collections.length > 0 ? (
              <ul className="space-y-2">
                {document.collections.map((docCollection) => (
                  <li key={docCollection.collectionId}>
                    <Link
                      href={`/dashboard/collections/${docCollection.collectionId}`}
                      className="text-accent-light dark:text-accent-dark hover:underline"
                    >
                      {docCollection.collection.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-light/70 dark:text-text-dark/70">This document is not in any collections yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Content</CardTitle>
          <CardDescription>Preview of document chunks</CardDescription>
        </CardHeader>
        <CardContent>
          {document.chunks.length > 0 ? (
            <div className="space-y-4">
              {document.chunks.map((chunk, index) => (
                <div key={chunk.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">
                      Page {chunk.page || "Unknown"} - {chunk.section || "Content"}
                    </span>
                    <span className="text-xs text-text-light/60 dark:text-text-dark/60">Chunk {index + 1}</span>
                  </div>
                  <p className="text-sm whitespace-pre-line">{chunk.text}</p>
                </div>
              ))}
              {document.chunks.length < document.pageCount! && (
                <p className="text-center text-text-light/70 dark:text-text-dark/70 text-sm mt-4">
                  Showing {document.chunks.length} of {document.pageCount} pages. Chat with this document to explore
                  more content.
                </p>
              )}
            </div>
          ) : (
            <p className="text-text-light/70 dark:text-text-dark/70">
              No content chunks available. The document may still be processing.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
