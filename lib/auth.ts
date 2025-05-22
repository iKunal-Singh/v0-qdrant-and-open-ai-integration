import { PrismaAdapter } from "@auth/prisma-adapter"
import { compare } from "bcryptjs"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { validateEnv } from "@/lib/env"
import prisma from "@/lib/prisma"

const env = validateEnv()

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
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "USER",
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      // Always allow sign in
      return true
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects after sign in
      // If the URL starts with the base URL, allow it
      if (url.startsWith(baseUrl)) return url

      // If the URL is a relative URL, prepend the base URL
      if (url.startsWith("/")) return `${baseUrl}${url}`

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

      return session
    },
    async jwt({ token, user, account, profile }) {
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

            return {
              ...token,
              id: newUser.id,
              role: newUser.role,
            }
          }
        } catch (error) {
          console.error("Error handling Google sign-in:", error)
          // Continue with token as is
        }
      }

      // Return previous token if the user hasn't changed
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
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User ${user.email} signed in with ${account?.provider}`)
    },
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`)
    },
    async linkAccount({ user, account, profile }) {
      console.log(`Account linked for user: ${user.email}`)
    },
    async session({ session, token }) {
      // Log session updates if needed
    },
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error(`Auth error: ${code}`, metadata)
    },
    warn(code) {
      console.warn(`Auth warning: ${code}`)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.debug(`Auth debug: ${code}`, metadata)
      }
    },
  },
}
