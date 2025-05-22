"use client"

import { useSession } from "next-auth/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoaderIcon } from "lucide-react"
import Link from "next/link"

export function AuthStatus() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
          <CardDescription>Checking your authentication status...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <LoaderIcon className="h-8 w-8 animate-spin text-accent-light dark:text-accent-dark" />
        </CardContent>
      </Card>
    )
  }

  if (status === "authenticated") {
    return (
      <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <AlertTitle className="text-green-800 dark:text-green-300">Authenticated</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-400">
          You are signed in as {session.user.name || session.user.email}
          <div className="mt-2">
            <Link href="/dashboard">
              <Button size="sm" variant="outline" className="mr-2">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
      <AlertTitle className="text-yellow-800 dark:text-yellow-300">Not Authenticated</AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-400">
        You are not signed in.
        <div className="mt-2">
          <Link href="/auth/login">
            <Button size="sm" variant="outline" className="mr-2">
              Sign In
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  )
}
