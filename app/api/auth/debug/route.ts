import { NextResponse } from "next/server"

export async function GET() {
  // Get environment variables relevant to Google OAuth
  const googleClientId = process.env.GOOGLE_CLIENT_ID || "Not set"
  const googleClientIdLength = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.length : 0

  const googleClientSecretSet = process.env.GOOGLE_CLIENT_SECRET ? "Set (hidden for security)" : "Not set"

  const nextAuthUrl = process.env.NEXTAUTH_URL || "Not set"
  const vercelUrl = process.env.VERCEL_URL || "Not set"

  // Return diagnostic information
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    auth: {
      googleClientId: `${googleClientId.substring(0, 5)}...${googleClientId.substring(googleClientIdLength - 5)}`,
      googleClientIdLength,
      googleClientSecretSet,
      nextAuthUrl,
      vercelUrl,
      baseUrl:
        process.env.NEXTAUTH_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
    },
    timestamp: new Date().toISOString(),
  })
}
