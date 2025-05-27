import { PrismaAdapter } from "@auth/prisma-adapter"
import { compare } from "bcryptjs"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { validateEnv } from "@/lib/env"
import prisma from "@/lib/prisma"

const env = validateEnv()

// Enhanced logging function with structured logging
export function logAuthEvent(event: string, details: any, level: "info" | "warn" | "error" = "info") {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    details,
    environment: process.env.NODE_ENV,
  }

  console.log(`[AUTH-${level.toUpperCase()}] ${event}:`, JSON.stringify(logEntry, null, 2))

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === "production" && level === "error") {
    // Example: Send to external logging service
    // await sendToLoggingService(logEntry)
  }
}

// Determine the base URL for the application with validation
function getBaseUrl(): string {
  const baseUrl =
    process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  // Validate the base URL format
  try {
    new URL(baseUrl)
  } catch (error) {
    logAuthEvent("Invalid base URL configuration", { baseUrl, error }, "error")
    throw new Error(`Invalid NEXTAUTH_URL or VERCEL_URL: ${baseUrl}`)
  }

  return baseUrl
}

const baseUrl = getBaseUrl()
const isProduction = process.env.NODE_ENV === "production"

// Validate required environment variables
function validateAuthEnvironment() {
  const required = {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  }

  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    logAuthEvent("Missing required environment variables", { missing }, "error")
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }

  logAuthEvent("Environment validation passed", { baseUrl, isProduction })
}

// Validate environment on startup
validateAuthEnvironment()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Enhanced cookie configuration with better security
  cookies: {
    sessionToken: {
      name: `${isProduction ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
        domain: isProduction ? undefined : undefined, // Let the browser determine
      },
    },
    callbackUrl: {
      name: `${isProduction ? "__Secure-" : ""}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
    csrfToken: {
      name: `${isProduction ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          logAuthEvent("Invalid credentials provided", { email: credentials?.email }, "warn")
          throw new Error("Invalid credentials")
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user || !user.password) {
            logAuthEvent("User not found or no password", { email: credentials.email }, "warn")
            throw new Error("User not found")
          }

          const isPasswordValid = await compare(credentials.password, user.password)

          if (!isPasswordValid) {
            logAuthEvent("Invalid password attempt", { email: credentials.email }, "warn")
            throw new Error("Invalid password")
          }

          logAuthEvent("Successful credentials authentication", { userId: user.id, email: user.email })
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          }
        } catch (error) {
          logAuthEvent(
            "Database error during authentication",
            {
              email: credentials.email,
              error: error instanceof Error ? error.message : String(error),
            },
            "error",
          )
          throw error
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          // Explicitly set the redirect_uri to ensure consistency
          redirect_uri: `${baseUrl}/api/auth/callback/google`,
        },
      },
      profile(profile) {
        logAuthEvent("Google profile received", {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          verified_email: profile.email_verified,
        })

        // Validate required profile fields
        if (!profile.email) {
          logAuthEvent("Google profile missing email", { profile }, "error")
          throw new Error("Google profile is missing email address")
        }

        return {
          id: profile.sub,
          name: profile.name || "Unknown Name",
          email: profile.email,
          image: profile.picture,
          role: "USER",
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user, credentials }) {
      logAuthEvent("Sign in callback triggered", {
        provider: account?.provider,
        email: user?.email || profile?.email,
        hasProfile: !!profile,
        hasCredentials: !!credentials,
        accountType: account?.type,
      })

      try {
        // For Google sign-in
        if (account?.provider === "google" && profile?.email) {
          // Validate Google account
          if (!profile.email_verified) {
            logAuthEvent("Google email not verified", { email: profile.email }, "warn")
            return false
          }

          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
          })

          logAuthEvent("Google sign-in user lookup", {
            email: profile.email,
            userExists: !!existingUser,
            userId: existingUser?.id,
          })

          return true
        }

        return true
      } catch (error) {
        logAuthEvent(
          "Error in signIn callback",
          {
            provider: account?.provider,
            email: user?.email || profile?.email,
            error: error instanceof Error ? error.message : String(error),
          },
          "error",
        )
        return false
      }
    },

    async redirect({ url, baseUrl: callbackBaseUrl }) {
      logAuthEvent("Redirect callback", { url, baseUrl: callbackBaseUrl })

      try {
        // Validate the redirect URL
        if (url.startsWith(callbackBaseUrl)) {
          return url
        }

        if (url.startsWith("/")) {
          return `${callbackBaseUrl}${url}`
        }

        // For security, only allow redirects to the same domain
        const redirectUrl = new URL(url)
        const baseUrlObj = new URL(callbackBaseUrl)

        if (redirectUrl.hostname === baseUrlObj.hostname) {
          return url
        }

        logAuthEvent("Blocked external redirect", { url, baseUrl: callbackBaseUrl }, "warn")
        return callbackBaseUrl
      } catch (error) {
        logAuthEvent("Error in redirect callback", { url, error }, "error")
        return callbackBaseUrl
      }
    },

    async session({ token, session }) {
      try {
        if (token) {
          session.user.id = token.id as string
          session.user.name = token.name as string
          session.user.email = token.email as string
          session.user.image = token.picture as string
          session.user.role = token.role as string
        }

        logAuthEvent("Session callback completed", {
          userId: session.user.id,
          userEmail: session.user.email,
        })

        return session
      } catch (error) {
        logAuthEvent("Error in session callback", { error }, "error")
        throw error
      }
    },

    async jwt({ token, user, account, profile, trigger }) {
      logAuthEvent("JWT callback triggered", {
        hasToken: !!token,
        hasUser: !!user,
        hasAccount: !!account,
        hasProfile: !!profile,
        provider: account?.provider,
        trigger,
      })

      try {
        // Initial sign in
        if (account && user) {
          logAuthEvent("Initial JWT creation", {
            userId: user.id,
            provider: account.provider,
          })

          return {
            ...token,
            id: user.id,
            role: user.role || "USER",
          }
        }

        // Google sign in - handle user creation/update
        if (account?.provider === "google" && profile && !user) {
          try {
            const existingUser = await prisma.user.findUnique({
              where: { email: profile.email },
            })

            if (existingUser) {
              // Update existing user
              const updatedUser = await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  name: profile.name,
                  image: profile.picture,
                  emailVerified: new Date(), // Mark as verified since it's from Google
                },
              })

              logAuthEvent("Updated existing Google user", {
                userId: updatedUser.id,
                email: updatedUser.email,
              })

              return {
                ...token,
                id: updatedUser.id,
                role: updatedUser.role,
              }
            } else {
              // Create new user
              const newUser = await prisma.user.create({
                data: {
                  name: profile.name,
                  email: profile.email as string,
                  image: profile.picture,
                  role: "USER",
                  emailVerified: new Date(),
                },
              })

              logAuthEvent("Created new Google user", {
                userId: newUser.id,
                email: newUser.email,
              })

              return {
                ...token,
                id: newUser.id,
                role: newUser.role,
              }
            }
          } catch (dbError) {
            logAuthEvent(
              "Database error during Google user processing",
              {
                email: profile.email,
                error: dbError instanceof Error ? dbError.message : String(dbError),
              },
              "error",
            )
            throw new Error("Failed to process user data")
          }
        }

        // Refresh user data from database
        if (token.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: token.email },
            })

            if (dbUser) {
              return {
                ...token,
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                picture: dbUser.image,
                role: dbUser.role,
              }
            }
          } catch (dbError) {
            logAuthEvent(
              "Error refreshing user data",
              {
                email: token.email,
                error: dbError instanceof Error ? dbError.message : String(dbError),
              },
              "error",
            )
          }
        }

        return token
      } catch (error) {
        logAuthEvent(
          "Critical error in JWT callback",
          {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
          "error",
        )
        throw error
      }
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      logAuthEvent("User signed in successfully", {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
      })
    },
    async createUser({ user }) {
      logAuthEvent("New user created", { userId: user.id, email: user.email })
    },
    async linkAccount({ user, account, profile }) {
      logAuthEvent("Account linked", {
        userId: user.id,
        email: user.email,
        provider: account.provider,
      })
    },
    async error(error) {
      logAuthEvent(
        "NextAuth error event",
        {
          error: error.message,
          name: error.name,
          stack: error.stack,
        },
        "error",
      )
    },
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      logAuthEvent(`NextAuth Error: ${code}`, metadata, "error")
    },
    warn(code) {
      logAuthEvent(`NextAuth Warning: ${code}`, {}, "warn")
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        logAuthEvent(`NextAuth Debug: ${code}`, metadata)
      }
    },
  },
}
