/**
 * Google OAuth Configuration Helper
 *
 * This file provides utilities to help with Google OAuth configuration.
 */

/**
 * Gets the correct redirect URI for Google OAuth
 *
 * @returns The redirect URI to use for Google OAuth
 */
export function getGoogleOAuthRedirectUri(): string {
  // Priority order: NEXTAUTH_URL, VERCEL_URL, localhost
  const baseUrl =
    process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  return `${baseUrl}/api/auth/callback/google`
}

/**
 * Gets the list of authorized JavaScript origins for Google OAuth
 *
 * @returns Array of authorized JavaScript origins
 */
export function getAuthorizedJavaScriptOrigins(): string[] {
  const origins = []

  // Add NEXTAUTH_URL if set
  if (process.env.NEXTAUTH_URL) {
    origins.push(process.env.NEXTAUTH_URL)
  }

  // Add Vercel URL if set
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`)
  }

  // Add localhost for development
  if (process.env.NODE_ENV === "development") {
    origins.push("http://localhost:3000")
  }

  return origins
}

/**
 * Gets the list of authorized redirect URIs for Google OAuth
 *
 * @returns Array of authorized redirect URIs
 */
export function getAuthorizedRedirectUris(): string[] {
  const uris = []

  // Add NEXTAUTH_URL callback if set
  if (process.env.NEXTAUTH_URL) {
    uris.push(`${process.env.NEXTAUTH_URL}/api/auth/callback/google`)
  }

  // Add Vercel URL callback if set
  if (process.env.VERCEL_URL) {
    uris.push(`https://${process.env.VERCEL_URL}/api/auth/callback/google`)
  }

  // Add localhost callback for development
  if (process.env.NODE_ENV === "development") {
    uris.push("http://localhost:3000/api/auth/callback/google")
  }

  return uris
}
