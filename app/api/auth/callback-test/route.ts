import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get the base URL for the application
  const baseUrl =
    process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  // Get the callback URL for Google
  const googleCallbackUrl = `${baseUrl}/api/auth/callback/google`

  // Check if NEXTAUTH_SECRET is set
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET

  // Check if we're in a production environment
  const isProduction = process.env.NODE_ENV === "production"

  // Get the host from the request
  const host = request.headers.get("host") || "unknown"

  // Check if the host matches the NEXTAUTH_URL
  const nextAuthUrl = process.env.NEXTAUTH_URL || ""
  const hostMatchesNextAuthUrl = nextAuthUrl.includes(host)

  // Check if cookies are being set with the correct settings
  const cookiePrefix = isProduction ? "__Secure-" : ""
  const expectedSessionCookieName = `${cookiePrefix}next-auth.session-token`

  // Check for proxy headers
  const hasForwardedProto = !!request.headers.get("x-forwarded-proto")
  const forwardedProto = request.headers.get("x-forwarded-proto") || "none"
  const hasForwardedHost = !!request.headers.get("x-forwarded-host")
  const forwardedHost = request.headers.get("x-forwarded-host") || "none"

  // Check for CSRF token in cookies
  const cookies = request.cookies.getAll()
  const csrfCookie = cookies.find((cookie) => cookie.name.includes("csrf-token"))

  return NextResponse.json({
    diagnostics: {
      environment: process.env.NODE_ENV,
      baseUrl,
      googleCallbackUrl,
      hasNextAuthSecret,
      isProduction,
      host,
      nextAuthUrl,
      hostMatchesNextAuthUrl,
      expectedSessionCookieName,
      proxy: {
        hasForwardedProto,
        forwardedProto,
        hasForwardedHost,
        forwardedHost,
      },
      csrf: {
        hasCsrfCookie: !!csrfCookie,
        csrfCookieName: csrfCookie?.name || "not-found",
      },
      cookies: cookies.map((cookie) => ({
        name: cookie.name,
        // Don't include values for security reasons
        hasValue: !!cookie.value,
      })),
    },
    timestamp: new Date().toISOString(),
  })
}
