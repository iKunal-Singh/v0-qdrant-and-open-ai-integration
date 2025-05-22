/**
 * Authentication Diagnostics Utility
 *
 * This utility provides functions to diagnose authentication issues.
 */

import { headers } from "next/headers"

/**
 * Checks if the required environment variables for authentication are set
 */
export function checkAuthEnvironmentVariables() {
  const requiredVars = ["NEXTAUTH_URL", "NEXTAUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]

  const missingVars = requiredVars.filter((varName) => !process.env[varName])

  return {
    allPresent: missingVars.length === 0,
    missingVars,
  }
}

/**
 * Gets the callback URL for a specific provider
 */
export function getProviderCallbackUrl(provider: string) {
  const baseUrl =
    process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  return `${baseUrl}/api/auth/callback/${provider}`
}

/**
 * Checks if the current request is coming from a secure context
 */
export function isSecureContext() {
  const headersList = headers()
  const protocol = headersList.get("x-forwarded-proto") || "http"
  const host = headersList.get("host") || ""

  return {
    isSecure: protocol === "https" || host.includes("localhost"),
    protocol,
    host,
  }
}

/**
 * Generates a comprehensive authentication diagnostic report
 */
export async function generateAuthDiagnosticReport() {
  const envCheck = checkAuthEnvironmentVariables()
  const securityCheck = isSecureContext()
  const googleCallbackUrl = getProviderCallbackUrl("google")

  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    environmentVariables: envCheck,
    securityContext: securityCheck,
    callbackUrls: {
      google: googleCallbackUrl,
    },
    nextAuthUrl: process.env.NEXTAUTH_URL,
    vercelUrl: process.env.VERCEL_URL,
  }
}
