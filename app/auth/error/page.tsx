"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Info, HelpCircle, RefreshCw, ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [troubleshootingSteps, setTroubleshootingSteps] = useState<string[]>([])
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchDiagnostics = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/callback/google/debug")
      if (response.ok) {
        const data = await response.json()
        setDiagnostics(data)
      }
    } catch (error) {
      console.error("Failed to fetch diagnostics:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const errorParam = searchParams?.get("error") || null
    setErrorCode(errorParam)

    if (errorParam) {
      switch (errorParam) {
        case "Callback":
          setError("Authentication Callback Error")
          setErrorDetails(
            "There was an issue processing the authentication callback from Google. This typically occurs when there's a configuration mismatch or network issue during the OAuth flow.",
          )
          setTroubleshootingSteps([
            "Verify that your NEXTAUTH_URL environment variable matches your application's actual URL",
            "Check that the callback URL in Google Cloud Console exactly matches: [your-domain]/api/auth/callback/google",
            "Ensure your NEXTAUTH_SECRET is set and consistent across all environments",
            "Verify that your Google OAuth consent screen is properly configured and published",
            "Check that the Google People API is enabled in your Google Cloud project",
            "Clear your browser cookies and cache, then try signing in again",
            "If using a custom domain, ensure SSL certificates are properly configured",
          ])
          break
        case "OAuthSignin":
          setError("OAuth Sign-in Error")
          setErrorDetails(
            "Failed to initiate the OAuth sign-in process with Google. This could be due to incorrect OAuth client configuration.",
          )
          setTroubleshootingSteps([
            "Verify your GOOGLE_CLIENT_ID environment variable is correctly set",
            "Check that your GOOGLE_CLIENT_SECRET environment variable is correctly set",
            "Ensure your OAuth application in Google Cloud Console is properly configured",
            "Verify that the OAuth consent screen is published (not in testing mode) or your email is added as a test user",
            "Check that the Google People API is enabled in your Google Cloud project",
          ])
          break
        case "OAuthCallback":
          setError("OAuth Callback Error")
          setErrorDetails(
            "Google successfully authenticated you, but there was an error processing the callback in our application.",
          )
          setTroubleshootingSteps([
            "Check that your callback URL in Google Cloud Console exactly matches your application's callback URL",
            "Verify that your application is requesting the correct OAuth scopes",
            "Ensure your NEXTAUTH_SECRET environment variable is set and consistent",
            "Check that your database is accessible and properly configured",
            "Verify that your Google Cloud project is not suspended or restricted",
          ])
          break
        case "OAuthCreateAccount":
          setError("Account Creation Error")
          setErrorDetails(
            "Authentication was successful, but we couldn't create or update your account in our database.",
          )
          setTroubleshootingSteps([
            "Check your database connection and ensure it's accessible",
            "Verify that your database schema is up to date (run Prisma migrations)",
            "Ensure your database has sufficient storage and connection capacity",
            "Check for any unique constraint violations in the database logs",
            "Verify that the user table exists and has the correct structure",
          ])
          break
        case "AccessDenied":
          setError("Access Denied")
          setErrorDetails("You denied permission to access your Google account, or your access has been restricted.")
          setTroubleshootingSteps([
            "Try signing in again and grant the requested permissions",
            "Check if your Google account has any restrictions",
            "Contact the application administrator if you believe this is an error",
            "Verify that you're using the correct Google account",
          ])
          break
        case "Configuration":
          setError("Configuration Error")
          setErrorDetails(
            "There's a problem with the server's authentication configuration. This is not an issue with your account.",
          )
          setTroubleshootingSteps([
            "Contact the application administrator to report this configuration issue",
            "The server may be missing required environment variables",
            "Check the server logs for specific configuration errors",
          ])
          break
        default:
          setError("Authentication Error")
          setErrorDetails(`An unexpected authentication error occurred (${errorParam}). Please try again.`)
          setTroubleshootingSteps([
            "Try signing in again after a few minutes",
            "Clear your browser cookies and cache, then attempt to sign in again",
            "Try using a different browser or incognito/private mode",
            "Contact support if the problem persists",
          ])
      }
    } else {
      setError("Unknown Error")
      setErrorDetails("An unknown error occurred during the authentication process.")
      setTroubleshootingSteps([
        "Try signing in again",
        "Clear your browser cookies and cache",
        "Try using a different browser",
        "Contact support if the problem persists",
      ])
    }

    // Fetch diagnostics on load
    fetchDiagnostics()
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">{error}</CardTitle>
          <CardDescription className="text-center">{errorDetails}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="troubleshooting">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
              <TabsTrigger value="technical">Technical Details</TabsTrigger>
            </TabsList>

            <TabsContent value="troubleshooting" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <HelpCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Try these steps to resolve the issue:</h3>
                    <ul className="list-disc pl-5 mt-2 space-y-2 text-sm">
                      {troubleshootingSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {errorCode === "Callback" && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Quick Fix for Callback Errors</AlertTitle>
                    <AlertDescription>
                      Most callback errors are caused by URL mismatches. Visit the{" "}
                      <Link href="/auth/callback-debug" className="text-blue-600 hover:underline">
                        callback diagnostics page
                      </Link>{" "}
                      for detailed configuration checking.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="diagnostics" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Authentication Diagnostics</h3>
                  <Button onClick={fetchDiagnostics} disabled={loading} size="sm" variant="outline">
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>

                {diagnostics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                        <div className="text-sm font-medium">Environment</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {diagnostics.config?.nodeEnv || "Unknown"}
                        </div>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                        <div className="text-sm font-medium">Secure Context</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {diagnostics.diagnostics?.isSecure ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                      <div className="text-sm font-medium mb-2">Expected Callback URL</div>
                      <div className="text-sm font-mono bg-white dark:bg-gray-900 p-2 rounded">
                        {diagnostics.diagnostics?.expectedCallbackUrl}
                      </div>
                    </div>

                    {diagnostics.callbackParams?.error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>OAuth Error from Google</AlertTitle>
                        <AlertDescription>
                          <div className="font-mono text-sm">
                            Error: {diagnostics.callbackParams.error}
                            {diagnostics.callbackParams.error_description && (
                              <div>Description: {diagnostics.callbackParams.error_description}</div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading diagnostics...</div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="technical" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium">Technical Information</h3>
                    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-mono overflow-x-auto">
                      <div>Error Code: {errorCode || "Unknown"}</div>
                      <div>Timestamp: {new Date().toISOString()}</div>
                      <div>User Agent: {navigator.userAgent}</div>
                      <div>URL: {window.location.href}</div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Include this information when contacting support for faster resolution.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="flex gap-2 w-full">
            <Button asChild className="flex-1">
              <Link href="/auth/login">Try Again</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
          <div className="flex gap-2 w-full">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href="/auth/callback-debug">
                <ExternalLink className="h-4 w-4 mr-2" />
                Callback Debug
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  )
}
