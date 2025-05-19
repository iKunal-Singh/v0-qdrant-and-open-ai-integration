import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileTextIcon, FolderIcon, MessageSquareIcon } from "lucide-react"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Get user stats
  const documentCount = await prisma.document.count({
    where: {
      userId: session.user.id,
    },
  })

  const collectionCount = await prisma.collection.count({
    where: {
      userId: session.user.id,
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display tracking-wide text-text-light dark:text-text-dark">
          WELCOME BACK,{" "}
          <span className="text-accent-light dark:text-accent-dark">{session.user.name?.toUpperCase() || "USER"}</span>
        </h1>
        <p className="text-text-light/70 dark:text-text-dark/70">Here's an overview of your documents and activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileTextIcon className="h-4 w-4 text-accent-light dark:text-accent-dark" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentCount}</div>
            <p className="text-xs text-text-light/70 dark:text-text-dark/70">Documents uploaded to your account</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <FolderIcon className="h-4 w-4 text-accent-light dark:text-accent-dark" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectionCount}</div>
            <p className="text-xs text-text-light/70 dark:text-text-dark/70">Organized document collections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <MessageSquareIcon className="h-4 w-4 text-accent-light dark:text-accent-dark" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-text-light/70 dark:text-text-dark/70">Last active today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Your recently uploaded documents</CardDescription>
          </CardHeader>
          <CardContent>
            {documentCount > 0 ? (
              <p>Document list will appear here</p>
            ) : (
              <p className="text-text-light/70 dark:text-text-dark/70">
                You haven't uploaded any documents yet. Go to the Upload page to get started.
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Chats</CardTitle>
            <CardDescription>Your recent document conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-text-light/70 dark:text-text-dark/70">
              Chat history will appear here once you start chatting with your documents.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
