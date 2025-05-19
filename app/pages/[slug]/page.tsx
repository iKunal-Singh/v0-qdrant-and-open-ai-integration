import { notFound } from "next/navigation"
import type { Metadata } from "next"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Markdown } from "@/components/ui/markdown"

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await prisma.page.findUnique({
    where: {
      slug: params.slug,
      isPublished: true,
    },
  })

  if (!page) {
    return {
      title: "Page Not Found",
    }
  }

  return {
    title: `${page.title} | Agent DOC`,
    description: page.content.substring(0, 160),
  }
}

export default async function Page({ params }: PageProps) {
  const page = await prisma.page.findUnique({
    where: {
      slug: params.slug,
      isPublished: true,
    },
  })

  if (!page) {
    notFound()
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-display tracking-wide text-text-light dark:text-text-dark">
            {page.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Markdown content={page.content} />
        </CardContent>
      </Card>
    </div>
  )
}
