import { PrismaAdapter } from "@auth/prisma-adapter"
import { compare } from "bcryptjs"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { validateEnv } from "@/lib/env"
import prisma from "@/lib/prisma"

const env = validateEnv()

// Get the base URL for the application
const baseUrl =
  process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

// Enhanced logging function
function logAuthEvent(event: string, details: any) {
  console.log(`[AUTH] ${event}:`, JSON.stringify(details, null, 2))

  // In production, you might want to log to a service like Sentry or Datadog
  if (process.env.NODE_ENV === "production") {
    // Example: Sentry.captureMessage(`[AUTH] ${event}`, { extra: details })
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.password) {
          throw new Error("User not found")
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error("Invalid password")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      // Explicitly define the profile function to ensure consistent data structure
      profile(profile) {
        logAuthEvent("Google profile received", {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        })

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
      logAuthEvent("Sign in attempt", {
        provider: account?.provider,
        email: user?.email,
        hasProfile: !!profile,
        hasCredentials: !!credentials,
      })

      // For Google sign-in
      if (account?.provider === "google" && profile?.email) {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
          })

          logAuthEvent("User lookup result", {
            email: profile.email,
            userExists: !!existingUser,
          })

          return true
        } catch (error) {
          logAuthEvent("Error during sign in", { error })
          return false
        }
      }

      return true
    },
    async redirect({ url, baseUrl }) {
      logAuthEvent("Redirect callback", { url, baseUrl })

      // Handle redirects after sign in
      // If the URL starts with the base URL, allow it
      if (url.startsWith(baseUrl)) {
        return url
      }

      // If the URL is a relative URL, prepend the base URL
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }

      // Otherwise, return to the base URL
      return baseUrl
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.picture as string
        session.user.role = token.role as string
      }

      logAuthEvent("Session callback", {
        userId: session.user.id,
        userEmail: session.user.email,
      })

      return session
    },
    async jwt({ token, user, account, profile }) {
      logAuthEvent("JWT callback", {
        hasToken: !!token,
        hasUser: !!user,
        hasAccount: !!account,
        hasProfile: !!profile,
        provider: account?.provider,
      })

      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id,
          role: user.role || "USER",
        }
      }

      // Google sign in without existing user
      if (account?.provider === "google" && profile && !user) {
        try {
          // Check if user exists by email
          const existingUser = await prisma.user.findUnique({
            where: {
              email: profile.email,
            },
          })

          if (existingUser) {
            // User exists, update their profile
            const updatedUser = await prisma.user.update({
              where: {
                id: existingUser.id,
              },
              data: {
                name: profile.name,
                image: profile.picture,
              },
            })

            logAuthEvent("Updated existing user", {
              userId: updatedUser.id,
              email: updatedUser.email,
            })

            return {
              ...token,
              id: updatedUser.id,
              role: updatedUser.role,
            }
          } else {
            // Create a new user with Google profile data
            const newUser = await prisma.user.create({
              data: {
                name: profile.name,
                email: profile.email as string,
                image: profile.picture,
                role: "USER",
              },
            })

            logAuthEvent("Created new user", {
              userId: newUser.id,
              email: newUser.email,
            })

            return {
              ...token,
              id: newUser.id,
              role: newUser.role,
            }
          }
        } catch (error) {
          logAuthEvent("Error handling Google sign-in", { error })
          // Continue with token as is
        }
      }

      // Return previous token if the user hasn't changed
      try {
        const dbUser = await prisma.user.findFirst({
          where: {
            email: token.email,
          },
        })

        if (!dbUser) {
          if (user) {
            token.id = user.id
          }
          return token
        }

        return {
          ...token,
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          picture: dbUser.image,
          role: dbUser.role,
        }
      } catch (error) {
        logAuthEvent("Error retrieving user data for JWT", { error, email: token.email })
        return token
      }
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      logAuthEvent("User signed in", {
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
    async session({ session, token }) {
      // Log session updates if needed
      logAuthEvent("Session updated", {
        userId: session.user.id,
        email: session.user.email,
      })
    },
    async error(error) {
      logAuthEvent("Authentication error", { error })
    },
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      logAuthEvent(`Error: ${code}`, metadata)
    },
    warn(code) {
      logAuthEvent(`Warning: ${code}`, {})
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        logAuthEvent(`Debug: ${code}`, metadata)
      }
    },
  },
}
