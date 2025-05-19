import { getServerSession } from "next-auth/next"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { PageEditor } from "@/components/cms/page-editor"

export default async function EditPagePage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const page = await prisma.page.findUnique({
    where: {
      slug: params.slug,
    },
  })

  if (!page) {
    notFound()
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <PageEditor page={page} />
    </div>
  )
}
