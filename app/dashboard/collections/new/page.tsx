import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { CollectionForm } from "@/components/collections/collection-form"
import { ArrowLeftIcon } from "lucide-react"

export default async function NewCollectionPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button asChild variant="ghost" size="sm" className="mr-4">
          <Link href="/dashboard/collections">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Collections
          </Link>
        </Button>
        <h1 className="text-3xl font-display tracking-wide text-text-light dark:text-text-dark">
          NEW <span className="text-accent-light dark:text-accent-dark">COLLECTION</span>
        </h1>
      </div>

      <CollectionForm />
    </div>
  )
}
