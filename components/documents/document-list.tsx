"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileTextIcon, MoreVerticalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { deleteDocument } from "@/app/actions/document-actions"

interface Document {
  id: string
  title: string
  fileName: string
  fileSize: number
  status: string
  pageCount: number | null
  createdAt: Date
}

interface DocumentListProps {
  documents: Document[]
}

export function DocumentList({ documents }: DocumentListProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (documentId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setIsDeleting(documentId)

      try {
        const result = await deleteDocument(documentId)

        if (result.success) {
          router.refresh()
        } else {
          alert(result.error || "Failed to delete document")
        }
      } catch (error) {
        console.error("Error deleting document:", error)
        alert("An unexpected error occurred")
      } finally {
        setIsDeleting(null)
      }
    }
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileTextIcon className="mx-auto h-12 w-12 text-text-light/40 dark:text-text-dark/40 mb-4" />
        <h3 className="text-xl font-medium mb-2 text-text-light dark:text-text-dark">No documents found</h3>
        <p className="text-text-light/60 dark:text-text-dark/60 mb-6">Upload your first document to get started</p>
        <Button asChild className="bg-accent-light dark:bg-accent-dark">
          <Link href="/upload">Upload Document</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((document) => (
        <Card key={document.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5 text-accent-light dark:text-accent-dark" />
                <CardTitle className="text-base font-medium truncate">{document.title}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVerticalIcon className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/chat?documentId=${document.id}`}>Chat with document</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/documents/${document.id}`}>View details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 dark:text-red-400"
                    onClick={() => handleDelete(document.id)}
                    disabled={isDeleting === document.id}
                  >
                    {isDeleting === document.id ? "Deleting..." : "Delete document"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription className="truncate">
              {document.fileName} • {(document.fileSize / 1024 / 1024).toFixed(2)} MB
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center justify-between text-sm text-text-light/70 dark:text-text-dark/70">
              <span>
                {document.pageCount} {document.pageCount === 1 ? "page" : "pages"}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
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
            </div>
          </CardContent>
          <CardFooter className="pt-0 flex justify-between">
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <Link href={`/chat?documentId=${document.id}`}>Chat</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href={`/dashboard/documents/${document.id}`}>View Details</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
