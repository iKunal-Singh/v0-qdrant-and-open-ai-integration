"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LoaderIcon, AlertCircle } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import Link from "next/link"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Safely access search params with null checks
  const callbackUrl = searchParams ? searchParams.get("callbackUrl") || "/dashboard" : "/dashboard"
  const errorParam = searchParams ? searchParams.get("error") : null

  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Set error from URL parameter if present
  useEffect(() => {
    if (errorParam) {
      let errorMessage = "An error occurred during sign in"
      let details = "Please try again or contact support if the problem persists."

      // Map error codes to user-friendly messages
      switch (errorParam) {
        case "Callback":
          errorMessage = "Authentication callback error"
          details = "There was an issue with the authentication callback. This might be due to configuration issues."
          break
        case "AccessDenied":
          errorMessage = "Access denied"
          details = "You may not have permission to sign in. Please contact support if you believe this is an error."
          break
        case "OAuthSignin":
          errorMessage = "Sign-in error"
          details = "Error starting the authentication process. Please try again."
          break
        case "OAuthCallback":
          errorMessage = "Authentication error"
          details = "Error during the authentication callback. Please try again or use a different sign-in method."
          break
        case "OAuthCreateAccount":
          errorMessage = "Account creation error"
          details = "Error creating your account. Please try again or contact support."
          break
        case "EmailCreateAccount":
          errorMessage = "Email account error"
          details = "Error creating your email account. Please try again or contact support."
          break
        case "SessionRequired":
          errorMessage = "Authentication required"
          details = "You need to be signed in to access this page."
          break
        default:
          errorMessage = `Authentication error: ${errorParam}`
          details = "An unexpected error occurred. Please try again or contact support."
      }

      setError(errorMessage)
      setErrorDetails(details)
    }
  }, [errorParam])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)
    setErrorDetails(null)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl,
      })

      if (result?.error) {
        setError("Authentication failed")
        setErrorDetails(result.error)
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch (error) {
      setError("An unexpected error occurred")
      setErrorDetails("Please try again or contact support if the problem persists.")
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError(null)
    setErrorDetails(null)

    try {
      // Log the attempt for debugging
      console.log("Attempting Google sign-in with callback URL:", callbackUrl)

      // Use callbackUrl to redirect after successful authentication
      await signIn("google", {
        callbackUrl,
        redirect: true,
      })
      // Note: The page will redirect, so the code below won't execute
    } catch (error) {
      setError("Google sign-in failed")
      setErrorDetails("Please try again or use a different sign-in method.")
      console.error("Google sign-in error:", error)
      setIsGoogleLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-display tracking-wide text-text-light dark:text-text-dark">
          LOGIN TO <span className="text-accent-light dark:text-accent-dark">AGENT DOC</span>
        </CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error}</AlertTitle>
            <AlertDescription>
              {errorDetails}
              <div className="mt-2">
                <Link href="/auth/troubleshoot" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                  View troubleshooting guide
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a
                href="/auth/forgot-password"
                className="text-sm text-accent-light dark:text-accent-dark hover:underline"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-accent-light dark:bg-accent-dark hover:bg-accent-light/90 dark:hover:bg-accent-dark/90 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-primary-light dark:bg-primary-dark text-text-light/60 dark:text-text-dark/60">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              {isGoogleLoading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <FcGoogle className="h-5 w-5" />}
              <span>Sign in with Google</span>
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-text-light/60 dark:text-text-dark/60">
          Don't have an account?{" "}
          <a href="/auth/register" className="text-accent-light dark:text-accent-dark hover:underline">
            Sign up
          </a>
        </p>
      </CardFooter>
    </Card>
  )
}
