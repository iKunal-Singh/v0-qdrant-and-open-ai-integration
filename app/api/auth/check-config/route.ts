import { NextResponse } from "next/server"
import {
  getGoogleOAuthRedirectUri,
  getAuthorizedJavaScriptOrigins,
  getAuthorizedRedirectUris,
} from "@/lib/google-auth-helper"

export async function GET() {
  // Get configuration information
  const redirectUri = getGoogleOAuthRedirectUri()
  const jsOrigins = getAuthorizedJavaScriptOrigins()
  const redirectUris = getAuthorizedRedirectUris()

  // Return configuration information
  return NextResponse.json({
    googleOAuth: {
      redirectUri,
      authorizedJavaScriptOrigins: jsOrigins,
      authorizedRedirectUris: redirectUris,
    },
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
}
