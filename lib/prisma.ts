import { PrismaClient } from "@prisma/client"

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Check if we're in a production environment
const isProd = process.env.NODE_ENV === "production"

// Initialize PrismaClient
let prismaClient: PrismaClient

if (isProd) {
  // In production, create a new instance every time
  prismaClient = new PrismaClient()
} else {
  // In development, reuse the same instance
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
  prismaClient = globalForPrisma.prisma
}

export const prisma = prismaClient
export default prismaClient
