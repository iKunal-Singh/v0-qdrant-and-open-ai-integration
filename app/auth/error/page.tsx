"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Info, HelpCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [troubleshootingSteps, setTroubleshootingSteps] = useState<string[]>([])

  useEffect(() => {
    const errorParam = searchParams?.get("error") || null
    setErrorCode(errorParam)

    if (errorParam) {
      switch (errorParam) {
        case "Callback":
          setError("Authentication Callback Error")
          setErrorDetails(
            "There was an issue with the authentication callback. This typically happens when the authentication provider (like Google) redirects back to your application but there's an issue processing the response.",
          )
          setTroubleshootingSteps([
            "Check that your NEXTAUTH_URL environment variable is correctly set to your application's URL.",
            "Verify that the callback URL in your Google Cloud Console matches your application's callback URL (/api/auth/callback/google).",
            "Ensure your Google OAuth consent screen is properly configured and published.",
            "Try clearing your browser cookies and cache, then attempt to sign in again.",
            "Check that your NEXTAUTH_SECRET environment variable is set and is the same across all deployment environments.",
          ])
          break
        case "OAuthSignin":
          setError("OAuth Sign-in Error")
          setErrorDetails(
            "There was a problem starting the OAuth sign-in process. This could be due to misconfiguration of your OAuth provider settings.",
          )
          setTroubleshootingSteps([
            "Verify your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are correctly set.",
            "Check that your OAuth application in Google Cloud Console is properly configured.",
            "Ensure the OAuth consent screen is published and not in testing mode (or that your email is added as a test user).",
            "Verify that the Google People API is enabled in your Google Cloud project.",
          ])
          break
        case "OAuthCallback":
          setError("OAuth Callback Error")
          setErrorDetails(
            "There was a problem during the OAuth callback process. This typically happens when the authentication provider redirects back to your application but there's an issue with the data received.",
          )
          setTroubleshootingSteps([
            "Check that your callback URL in Google Cloud Console exactly matches your application's callback URL.",
            "Verify that your application is requesting the correct scopes (typically 'email' and 'profile').",
            "Ensure your NEXTAUTH_SECRET environment variable is set and is the same across all deployment environments.",
            "Check that your Google Cloud project is not suspended or restricted.",
          ])
          break
        case "OAuthCreateAccount":
          setError("Account Creation Error")
          setErrorDetails(
            "There was a problem creating your account after successful authentication. This could be due to issues with your database or user data processing.",
          )
          setTroubleshootingSteps([
            "Check your database connection and ensure it's properly configured.",
            "Verify that your Prisma schema is correctly set up for user accounts.",
            "Ensure your database has enough storage and connection capacity.",
            "Check for any unique constraint violations (e.g., email already exists).",
          ])
          break
        case "OAuthAccountNotLinked":
          setError("Account Not Linked")
          setErrorDetails(
            "The email associated with your Google account is already registered with a different authentication method. Please sign in using your original authentication method.",
          )
          setTroubleshootingSteps([
            "Sign in using the authentication method you originally used to create your account.",
            "If you can't remember your original authentication method, contact support for assistance.",
            "You can link multiple authentication methods to your account after signing in.",
          ])
          break
        case "AccessDenied":
          setError("Access Denied")
          setErrorDetails("You do not have permission to sign in. Your access might have been restricted.")
          setTroubleshootingSteps([
            "Contact the application administrator if you believe this is an error.",
            "Check if your account has been suspended or restricted.",
            "Verify that you're using the correct authentication method.",
          ])
          break
        case "Configuration":
          setError("Configuration Error")
          setErrorDetails(
            "There is a problem with the server configuration. This is not an issue with your account or credentials.",
          )
          setTroubleshootingSteps([
            "Contact the application administrator to report this issue.",
            "The server might be missing required environment variables or configuration settings.",
            "Administrators can check the server logs for specific error messages related to the auth configuration.",
          ])
          break
        default:
          setError("Authentication Error")
          setErrorDetails(`An unexpected authentication error occurred (${errorParam}). Please try again.`)
          setTroubleshootingSteps([
            "Try signing in again after a few minutes.",
            "Clear your browser cookies and cache, then attempt to sign in again.",
            "Try using a different browser or device.",
            "Contact support if the problem persists.",
          ])
      }
    } else {
      setError("Unknown Error")
      setErrorDetails("An unknown error occurred during the authentication process. Please try again.")
      setTroubleshootingSteps([
        "Try signing in again after a few minutes.",
        "Clear your browser cookies and cache, then attempt to sign in again.",
        "Try using a different browser or device.",
        "Contact support if the problem persists.",
      ])
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
              <TabsTrigger value="technical">Technical Details</TabsTrigger>
            </TabsList>
            <TabsContent value="troubleshooting" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <HelpCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Try these steps to resolve the issue:</h3>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                      {troubleshootingSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="technical" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Technical Information:</h3>
                    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-mono overflow-x-auto">
                      <p>Error Code: {errorCode || "Unknown"}</p>
                      <p>Time: {new Date().toISOString()}</p>
                      <p>Browser: {navigator.userAgent}</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Administrators: Detailed server-side logs are available and may provide further context for this error code and timestamp.
                    </p>
                    <p className="mt-2 text-sm">
                      If contacting support, please include this information to help diagnose the issue.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/auth/login">Return to Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Go to Homepage</Link>
          </Button>
          <div className="text-center mt-2 text-sm text-gray-500 dark:text-gray-400">
            Need help?{" "}
            <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
              Contact Support
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
