import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthStatus } from "@/components/auth/auth-status"

export default async function AuthDebugPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Authentication Debug</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client-Side Authentication Status</CardTitle>
            <CardDescription>
              This shows your authentication status from the client-side using the useSession hook
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthStatus />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Server-Side Session Data</CardTitle>
            <CardDescription>This shows your session data from the server-side using getServerSession</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto">
              {JSON.stringify(
                {
                  authenticated: !!session,
                  session: session
                    ? {
                        user: {
                          name: session.user.name,
                          email: session.user.email,
                          image: session.user.image,
                          role: session.user.role,
                        },
                        expires: session.expires,
                      }
                    : null,
                },
                null,
                2,
              )}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>
              These are the environment variables that affect authentication (values are hidden for security)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>NEXTAUTH_URL: {process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Not set"}</li>
              <li>NEXTAUTH_SECRET: {process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Not set"}</li>
              <li>GOOGLE_CLIENT_ID: {process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Not set"}</li>
              <li>GOOGLE_CLIENT_SECRET: {process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Not set"}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
