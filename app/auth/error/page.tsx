"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get("error")

    if (errorParam) {
      switch (errorParam) {
        case "OAuthAccountNotLinked":
          setError(
            "This email is already associated with another account. Please sign in using your original provider.",
          )
          break
        case "OAuthSignin":
        case "OAuthCallback":
          setError("There was a problem with the OAuth authentication. Please try again.")
          break
        case "AccessDenied":
          setError("Access denied. You may not have permission to sign in.")
          break
        case "Verification":
          setError("The verification link may have expired or is invalid. Please request a new one.")
          break
        default:
          setError("An authentication error occurred. Please try again.")
      }
    } else {
      setError("An unknown error occurred. Please try again.")
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Authentication Error</CardTitle>
          <CardDescription className="text-center">{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please try signing in again or contact support if the problem persists.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/auth/login">Return to Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
