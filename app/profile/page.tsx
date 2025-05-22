import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login?callbackUrl=/profile")
  }

  const userInitials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U"

  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
            <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{session.user.name}</CardTitle>
            <CardDescription>{session.user.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div>
              <h3 className="text-lg font-medium">Account Information</h3>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Account Type</p>
                  <p className="font-medium">{session.user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Authentication Method</p>
                  <p className="font-medium">{session.user.image ? "Google" : "Email and Password"}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Security</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your account is protected with secure authentication methods.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
