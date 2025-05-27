import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const searchParams = url.searchParams

  // Capture all callback parameters
  const callbackParams = {
    code: searchParams.get("code"),
    state: searchParams.get("state"),
    error: searchParams.get("error"),
    error_description: searchParams.get("error_description"),
    error_uri: searchParams.get("error_uri"),
  }

  // Get environment configuration
  const config = {
    baseUrl:
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
    googleClientId: process.env.GOOGLE_CLIENT_ID ? "[REDACTED]" : "Not set",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? "[REDACTED]" : "Not set",
    nextAuthSecret: process.env.NEXTAUTH_SECRET ? "[REDACTED]" : "Not set",
    nodeEnv: process.env.NODE_ENV,
  }

  // Check headers
  const headers = {
    host: request.headers.get("host"),
    userAgent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
    origin: request.headers.get("origin"),
    xForwardedProto: request.headers.get("x-forwarded-proto"),
    xForwardedHost: request.headers.get("x-forwarded-host"),
  }

  // Get cookies
  const cookies = request.cookies.getAll().map((cookie) => ({
    name: cookie.name,
    hasValue: !!cookie.value,
    // Don't include actual values for security
  }))

  // Try to get current session
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch (error) {
    console.error("Error getting session:", error)
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    callbackParams,
    config,
    headers,
    cookies,
    session: session
      ? {
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
          },
          expires: session.expires,
        }
      : null,
    diagnostics: {
      hasRequiredParams: !!(callbackParams.code || callbackParams.error),
      hasError: !!callbackParams.error,
      isSecure: headers.xForwardedProto === "https" || headers.host?.includes("localhost"),
      expectedCallbackUrl: `${config.baseUrl}/api/auth/callback/google`,
    },
  })
}
