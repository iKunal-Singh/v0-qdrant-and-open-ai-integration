"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoaderIcon } from "lucide-react"
import { createCollection } from "@/app/actions/document-actions"

export function CollectionForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await createCollection(formData)

      if (result.success) {
        setSuccess("Collection created successfully")
        // Reset form
        const form = document.getElementById("collection-form") as HTMLFormElement
        form.reset()

        // Redirect after a short delay
        setTimeout(() => {
          router.push("/dashboard/collections")
          router.refresh()
        }, 1500)
      } else {
        setError(result.error || "Failed to create collection")
      }
    } catch (error) {
      console.error("Error creating collection:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-display tracking-wide text-text-light dark:text-text-dark">
          CREATE <span className="text-accent-light dark:text-accent-dark">COLLECTION</span>
        </CardTitle>
        <CardDescription>Create a new collection to organize your documents</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <AlertDescription className="text-green-800 dark:text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        <form id="collection-form" action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name</Label>
            <Input id="name" name="name" placeholder="My Documents" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="A brief description of this collection"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="isPublic" name="isPublic" value="true" />
            <Label htmlFor="isPublic">Make collection public</Label>
          </div>

          <Button
            type="submit"
            className="w-full bg-accent-light dark:bg-accent-dark hover:bg-accent-light/90 dark:hover:bg-accent-dark/90 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Collection"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
