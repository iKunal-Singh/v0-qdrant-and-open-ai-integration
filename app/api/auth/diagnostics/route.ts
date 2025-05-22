import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  // Only allow in development or with admin access in production
  if (process.env.NODE_ENV !== "development") {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access to diagnostics endpoint" }, { status: 403 })
    }
  }

  // Collect environment variables (redact secrets)
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "[REDACTED]" : "Not set",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "[REDACTED]" : "Not set",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "[REDACTED]" : "Not set",
    DATABASE_URL: process.env.DATABASE_URL ? "[REDACTED]" : "Not set",
  }

  // Get callback URLs
  const baseUrl =
    process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  const callbackUrls = {
    google: `${baseUrl}/api/auth/callback/google`,
  }

  // Get current session
  const session = await getServerSession(authOptions)

  // Return diagnostic information
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    baseUrl,
    callbackUrls,
    envVars,
    session: session
      ? {
          expires: session.expires,
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
            // Redact image URL as it might contain sensitive tokens
            image: session.user.image ? "[REDACTED]" : null,
          },
        }
      : null,
    headers: {
      host: request.headers.get("host"),
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
    },
  })
}
