import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { PageEditor } from "@/components/cms/page-editor"

export default async function NewPagePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <PageEditor />
    </div>
  )
}
