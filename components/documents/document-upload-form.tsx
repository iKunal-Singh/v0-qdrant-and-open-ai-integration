"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { UploadIcon, FileTextIcon, XIcon, CheckIcon, AlertCircleIcon, LoaderIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface Collection {
  id: string
  name: string
}

interface DocumentUploadFormProps {
  collections?: Collection[]
}

export function DocumentUploadForm({ collections = [] }: DocumentUploadFormProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [uploadStatus, setUploadStatus] = useState<Record<string, "pending" | "success" | "error">>({})
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>("none")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)

      // Filter for supported file types
      const supportedFiles = newFiles.filter(
        (file) =>
          file.type === "application/pdf" ||
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.name.toLowerCase().endsWith(".pdf") ||
          file.name.toLowerCase().endsWith(".docx"),
      )

      if (supportedFiles.length !== newFiles.length) {
        setError("Only PDF and DOCX files are supported")
        setTimeout(() => setError(null), 5000)
      }

      // Check file size
      const oversizedFiles = supportedFiles.filter((file) => file.size > 10 * 1024 * 1024)
      if (oversizedFiles.length > 0) {
        setWarnings([...warnings, `${oversizedFiles.length} files exceed the 10MB size limit and will be skipped`])
        const validFiles = supportedFiles.filter((file) => file.size <= 10 * 1024 * 1024)
        setFiles((prev) => [...prev, ...validFiles])
      } else {
        setFiles((prev) => [...prev, ...supportedFiles])
      }

      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setError(null)
    setWarnings([])

    // Initialize progress and status for each file
    const initialProgress: Record<string, number> = {}
    const initialStatus: Record<string, "pending" | "success" | "error"> = {}

    files.forEach((file) => {
      initialProgress[file.name] = 0
      initialStatus[file.name] = "pending"
    })

    setUploadProgress(initialProgress)
    setUploadStatus(initialStatus)

    // Upload files one by one
    for (const file of files) {
      try {
        setUploadingFile(file.name)

        // Update progress as the file uploads
        setUploadProgress((prev) => ({ ...prev, [file.name]: 10 }))

        // Create a form data object
        const formData = new FormData()
        formData.append("file", file)

        // Add collection ID if selected
        if (selectedCollection !== "none") {
          formData.append("collectionId", selectedCollection)
        }

        console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`)

        // Use fetch with timeout to prevent hanging requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

        try {
          const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          // Update progress after the request completes
          setUploadProgress((prev) => ({ ...prev, [file.name]: 50 }))

          // Check if the response is ok
          if (!response.ok) {
            let errorMessage = `Server error: ${response.status} ${response.statusText}`

            try {
              // Try to parse as JSON, but handle non-JSON responses
              const contentType = response.headers.get("content-type")
              if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json()
                errorMessage = errorData.error || errorMessage
                if (errorData.details) {
                  errorMessage += `: ${errorData.details}`
                }
              }
            } catch (parseError) {
              console.error("Error parsing response:", parseError)
            }

            throw new Error(errorMessage)
          }

          // Parse the response
          let result
          try {
            result = await response.json()
          } catch (jsonError) {
            console.error("Error parsing JSON response:", jsonError)
            throw new Error("Invalid response from server")
          }

          // Check for warnings
          if (result.warning) {
            setWarnings((prev) => [...prev, `${file.name}: ${result.warning}`])
          }

          // Mark as success
          setUploadStatus((prev) => ({ ...prev, [file.name]: "success" }))
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }))

          console.log(`File uploaded successfully: ${file.name}`)
        } catch (fetchError) {
          console.error(`Fetch error for ${file.name}:`, fetchError)

          if (fetchError instanceof Error) {
            if (fetchError.name === "AbortError") {
              throw new Error("Upload timed out. The server took too long to respond.")
            } else {
              throw fetchError
            }
          } else {
            throw new Error("Unknown fetch error")
          }
        }
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err)
        setUploadStatus((prev) => ({ ...prev, [file.name]: "error" }))

        // Set a user-friendly error message
        if (err instanceof Error) {
          setError(`Failed to upload ${file.name}: ${err.message}`)
        } else {
          setError(`Failed to upload ${file.name}: Unknown error`)
        }
      } finally {
        setUploadingFile(null)
      }
    }

    setUploading(false)

    // Remove successfully uploaded files after a delay
    setTimeout(() => {
      setFiles((prev) => prev.filter((file) => uploadStatus[file.name] !== "success"))

      // Redirect to documents page if all uploads were successful
      const allSuccessful = files.every((file) => uploadStatus[file.name] === "success")
      if (allSuccessful) {
        router.push("/dashboard/documents")
        router.refresh()
      }
    }, 3000)
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files)

      // Filter for supported file types
      const supportedFiles = droppedFiles.filter(
        (file) =>
          file.type === "application/pdf" ||
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.name.toLowerCase().endsWith(".pdf") ||
          file.name.toLowerCase().endsWith(".docx"),
      )

      if (supportedFiles.length !== droppedFiles.length) {
        setError("Only PDF and DOCX files are supported")
        setTimeout(() => setError(null), 5000)
      }

      // Check file size
      const oversizedFiles = supportedFiles.filter((file) => file.size > 10 * 1024 * 1024)
      if (oversizedFiles.length > 0) {
        setWarnings([...warnings, `${oversizedFiles.length} files exceed the 10MB size limit and will be skipped`])
        const validFiles = supportedFiles.filter((file) => file.size <= 10 * 1024 * 1024)
        setFiles((prev) => [...prev, ...validFiles])
      } else {
        setFiles((prev) => [...prev, ...supportedFiles])
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <Alert
          variant="destructive"
          className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
        >
          <AlertCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-300">Error</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert className="mb-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <AlertCircleIcon className="h-5 w-5 text-amber-500 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">Warning</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            <ul className="list-disc pl-5 mt-2">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {collections.length > 0 && (
        <div className="mb-6">
          <Label htmlFor="collection" className="mb-2 block">
            Add to Collection (Optional)
          </Label>
          <Select value={selectedCollection} onValueChange={setSelectedCollection}>
            <SelectTrigger id="collection">
              <SelectValue placeholder="Select a collection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card
        className="border-dashed border-2 border-gray-300 dark:border-gray-700 bg-secondary-light/50 dark:bg-secondary-dark/50 rounded-2xl"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-16 px-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
          />

          <div className="w-20 h-20 rounded-full bg-accent-light/10 dark:bg-accent-dark/10 flex items-center justify-center mb-6">
            <UploadIcon className="h-10 w-10 text-accent-light dark:text-accent-dark" />
          </div>

          <h3 className="text-2xl font-display tracking-wide mb-3 text-text-light dark:text-text-dark">
            UPLOAD DOCUMENTS
          </h3>

          <p className="text-text-light/70 dark:text-text-dark/70 text-center mb-6">
            Drag and drop your files here or click to browse
          </p>

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            disabled={uploading}
            className="rounded-full px-6 py-2.5 border-accent-light dark:border-accent-dark text-accent-light dark:text-accent-dark hover:bg-accent-light/10 dark:hover:bg-accent-dark/10"
          >
            Select Files
          </Button>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="mt-8">
          <h4 className="text-lg font-medium mb-4 text-text-light dark:text-text-dark">Selected Files</h4>

          <div className="space-y-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center p-4 bg-primary-light dark:bg-primary-dark rounded-xl border border-gray-200 dark:border-gray-800"
              >
                <FileTextIcon className="h-5 w-5 text-accent-light dark:text-accent-dark mr-4" />

                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium truncate text-text-light dark:text-text-dark">{file.name}</p>
                  <p className="text-xs text-text-light/60 dark:text-text-dark/60">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  {uploadStatus[file.name] && (
                    <div className="mt-2">
                      <Progress
                        value={uploadProgress[file.name] || 0}
                        className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700"
                        indicatorClassName="bg-accent-light dark:bg-accent-dark"
                      />
                    </div>
                  )}
                </div>

                <div className="ml-4 flex-shrink-0">
                  {uploadStatus[file.name] === "success" ? (
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  ) : uploadStatus[file.name] === "error" ? (
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <AlertCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                  ) : uploading && uploadingFile === file.name ? (
                    <div className="h-8 w-8 rounded-full bg-accent-light/10 dark:bg-accent-dark/10 flex items-center justify-center">
                      <LoaderIcon className="h-4 w-4 text-accent-light dark:text-accent-dark animate-spin" />
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <XIcon className="h-4 w-4 text-text-light/60 dark:text-text-dark/60" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={uploadFiles}
              disabled={uploading || files.length === 0}
              className="rounded-full px-6 py-2.5 bg-accent-light dark:bg-accent-dark hover:bg-accent-light/90 dark:hover:bg-accent-dark/90 text-white"
            >
              {uploading ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingFile ? `Processing ${uploadingFile}...` : "Processing..."}
                </>
              ) : (
                <>
                  Upload {files.length} {files.length === 1 ? "File" : "Files"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
