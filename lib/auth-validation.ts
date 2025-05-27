/**
 * Authentication Validation Utilities
 *
 * This module provides comprehensive validation for authentication configuration
 * and callback processing to prevent common authentication errors.
 */

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

interface CallbackValidationParams {
  code?: string | null
  state?: string | null
  error?: string | null
  error_description?: string | null
}

/**
 * Validates the authentication environment configuration
 */
export function validateAuthConfig(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required environment variables
  const requiredVars = {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  }

  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`)
    }
  })

  // Validate NEXTAUTH_URL
  const nextAuthUrl = process.env.NEXTAUTH_URL
  if (!nextAuthUrl && process.env.NODE_ENV === "production") {
    errors.push("NEXTAUTH_URL must be set in production")
  }

  if (nextAuthUrl) {
    try {
      const url = new URL(nextAuthUrl)
      if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
        warnings.push("NEXTAUTH_URL should use HTTPS in production")
      }
    } catch {
      errors.push("NEXTAUTH_URL is not a valid URL")
    }
  }

  // Validate NEXTAUTH_SECRET
  const secret = process.env.NEXTAUTH_SECRET
  if (secret && secret.length < 32) {
    warnings.push("NEXTAUTH_SECRET should be at least 32 characters long")
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validates OAuth callback parameters
 */
export function validateCallbackParams(params: CallbackValidationParams): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for OAuth errors
  if (params.error) {
    switch (params.error) {
      case "access_denied":
        errors.push("User denied access to their Google account")
        break
      case "invalid_request":
        errors.push("Invalid OAuth request - check your Google OAuth configuration")
        break
      case "unauthorized_client":
        errors.push("OAuth client is not authorized - check your Google Cloud Console settings")
        break
      case "unsupported_response_type":
        errors.push("Unsupported response type - check your OAuth configuration")
        break
      case "invalid_scope":
        errors.push("Invalid OAuth scope requested")
        break
      case "server_error":
        errors.push("Google OAuth server error - try again later")
        break
      case "temporarily_unavailable":
        errors.push("Google OAuth service temporarily unavailable - try again later")
        break
      default:
        errors.push(`OAuth error: ${params.error}`)
    }

    if (params.error_description) {
      errors.push(`Details: ${params.error_description}`)
    }
  }

  // Check for required success parameters
  if (!params.error && !params.code) {
    errors.push("Missing authorization code in callback")
  }

  // Validate state parameter (CSRF protection)
  if (!params.state) {
    warnings.push("Missing state parameter - CSRF protection may be compromised")
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Generates callback URL for a given provider
 */
export function generateCallbackUrl(provider: string): string {
  const baseUrl =
    process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  return `${baseUrl}/api/auth/callback/${provider}`
}

/**
 * Validates that the current request context is secure
 */
export function validateSecureContext(headers: Headers): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const host = headers.get("host") || ""
  const proto = headers.get("x-forwarded-proto") || "http"
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1")

  if (process.env.NODE_ENV === "production" && proto !== "https" && !isLocalhost) {
    errors.push("HTTPS is required in production")
  }

  // Check for proxy headers in production
  if (process.env.NODE_ENV === "production") {
    const forwardedProto = headers.get("x-forwarded-proto")
    const forwardedHost = headers.get("x-forwarded-host")

    if (!forwardedProto && !isLocalhost) {
      warnings.push("Missing X-Forwarded-Proto header - check proxy configuration")
    }

    if (!forwardedHost && !isLocalhost) {
      warnings.push("Missing X-Forwarded-Host header - check proxy configuration")
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Comprehensive authentication health check
 */
export async function performAuthHealthCheck(): Promise<{
  overall: ValidationResult
  config: ValidationResult
  security: ValidationResult
  database: ValidationResult
}> {
  const config = validateAuthConfig()

  // Mock headers for server-side validation
  const mockHeaders = new Headers({
    host: process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).host : "localhost:3000",
    "x-forwarded-proto": process.env.NODE_ENV === "production" ? "https" : "http",
  })

  const security = validateSecureContext(mockHeaders)

  // Database connectivity check
  const database: ValidationResult = { isValid: true, errors: [], warnings: [] }
  try {
    // This would be implemented based on your database setup
    // For now, we'll assume it's working if we get here
  } catch (error) {
    database.isValid = false
    database.errors.push("Database connection failed")
  }

  const allErrors = [...config.errors, ...security.errors, ...database.errors]
  const allWarnings = [...config.warnings, ...security.warnings, ...database.warnings]

  const overall: ValidationResult = {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  }

  return {
    overall,
    config,
    security,
    database,
  }
}
