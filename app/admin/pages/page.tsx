import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon } from "lucide-react"

export default async function AdminPagesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const pages = await prisma.page.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display tracking-wide text-text-light dark:text-text-dark">
          CONTENT <span className="text-accent-light dark:text-accent-dark">PAGES</span>
        </h1>
        <Button
          asChild
          className="bg-accent-light dark:bg-accent-dark hover:bg-accent-light/90 dark:hover:bg-accent-dark/90 text-white"
        >
          <Link href="/admin/pages/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Page
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Pages</CardTitle>
          <CardDescription>Manage your website content pages</CardDescription>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <p className="text-text-light/70 dark:text-text-dark/70">
              No pages found. Create your first page to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4">Title</th>
                    <th className="text-left py-3 px-4">Slug</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Last Updated</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr key={page.id} className="border-b border-gray-200 dark:border-gray-800">
                      <td className="py-3 px-4">{page.title}</td>
                      <td className="py-3 px-4">{page.slug}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs ${
                            page.isPublished
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {page.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="py-3 px-4">{new Date(page.updatedAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/pages/${page.slug}`}>Edit</Link>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/pages/${page.slug}`} target="_blank">
                              View
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
