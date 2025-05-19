"use client"

import { useState, useEffect } from "react"
import { Loader2Icon, FileTextIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

type DocumentPreviewProps = {
  sourceId: number
  documentId: string
  page: number
  text: string
  file: string
  title?: string
}

export function DocumentPreview({ sourceId, documentId, page, text, file, title }: DocumentPreviewProps) {
  const [expanded, setExpanded] = useState(true)
  const [loading, setLoading] = useState(false)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadThumbnail = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch the thumbnail from our API
        const thumbnailUrl = `/api/documents/thumbnail/${documentId}?page=${page}&width=200&t=${Date.now()}`

        // Pre-load the image
        const img = new Image()
        img.onload = () => {
          setThumbnail(thumbnailUrl)
          setLoading(false)
        }
        img.onerror = () => {
          setError("Failed to load thumbnail")
          setLoading(false)
          setThumbnail(`/placeholder.svg?height=280&width=200&text=Page ${page}`)
        }
        img.src = thumbnailUrl
      } catch (error) {
        console.error("Failed to load thumbnail:", error)
        setError("Failed to load thumbnail")
        setLoading(false)
        setThumbnail(`/placeholder.svg?height=280&width=200&text=Page ${page}`)
      }
    }

    loadThumbnail()
  }, [documentId, page])

  return (
    <Card className="rounded-xl overflow-hidden border border-border shadow-sm">
      <CardHeader
        className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer bg-muted/30"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <FileTextIcon className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-medium">
            Source {sourceId}: {title || file} - Page {page}
          </CardTitle>
        </div>
        {expanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
      </CardHeader>

      {expanded && (
        <CardContent className="pt-4 px-4 pb-4">
          <div className="flex flex-col md:flex-row gap-5">
            {thumbnail && (
              <div className="flex-shrink-0 w-[150px] h-[210px] relative border border-border rounded-lg overflow-hidden">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                    <Loader2Icon className="h-6 w-6 text-muted-foreground animate-spin" />
                  </div>
                ) : (
                  <img
                    src={thumbnail || "/placeholder.svg"}
                    alt={`Page ${page} thumbnail`}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}

            <div className="flex-grow">
              <p className="text-sm text-background-foreground whitespace-pre-line leading-relaxed">{text}</p>

              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-full"
                  onClick={() => window.open(`/api/documents/view/${documentId}?page=${page}`, "_blank")}
                >
                  View Full Page
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
