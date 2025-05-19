"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoaderIcon } from "lucide-react"

const pageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  content: z.string(),
  isPublished: z.boolean().default(false),
})

type PageFormValues = z.infer<typeof pageSchema>

interface PageEditorProps {
  page?: {
    id: string
    title: string
    slug: string
    content: string
    isPublished: boolean
  }
}

export function PageEditor({ page }: PageEditorProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!page

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: page?.title || "",
      slug: page?.slug || "",
      content: page?.content || "",
      isPublished: page?.isPublished || false,
    },
  })

  const isPublished = watch("isPublished")

  const onSubmit = async (data: PageFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const url = isEditing ? `/api/cms/pages/${page.slug}` : "/api/cms/pages"

      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to save page. Please try again.")
        return
      }

      router.push("/admin/pages")
      router.refresh()
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Page save error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value

    // Only auto-generate slug if we're creating a new page and slug hasn't been manually edited
    if (!isEditing && !page?.slug) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")

      setValue("slug", slug)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-display tracking-wide text-text-light dark:text-text-dark">
          {isEditing ? "EDIT" : "CREATE"} <span className="text-accent-light dark:text-accent-dark">PAGE</span>
        </CardTitle>
        <CardDescription>
          {isEditing ? "Update the page content and settings" : "Create a new page for your website"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              placeholder="Enter page title"
              {...register("title")}
              onChange={(e) => {
                register("title").onChange(e)
                handleTitleChange(e)
              }}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              placeholder="page-url-slug"
              {...register("slug")}
              className={errors.slug ? "border-red-500" : ""}
              disabled={isEditing}
            />
            {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
            {!errors.slug && (
              <p className="text-xs text-text-light/60 dark:text-text-dark/60">
                The page will be accessible at: /pages/{watch("slug")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Enter page content..."
              rows={15}
              {...register("content")}
              className={errors.content ? "border-red-500" : ""}
            />
            {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
            <p className="text-xs text-text-light/60 dark:text-text-dark/60">
              You can use Markdown formatting for rich content.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublished"
              checked={isPublished}
              onCheckedChange={(checked) => setValue("isPublished", checked)}
            />
            <Label htmlFor="isPublished">Publish page</Label>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/pages")} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-accent-light dark:bg-accent-dark hover:bg-accent-light/90 dark:hover:bg-accent-dark/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Page"
              ) : (
                "Create Page"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
