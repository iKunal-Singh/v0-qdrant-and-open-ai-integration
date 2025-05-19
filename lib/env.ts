import { z } from "zod"

// Define environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),

  // Authentication
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1),

  // External Services
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_ID: z.string().min(1).optional(),

  // Email
  EMAIL_SERVER_HOST: z.string().min(1).optional(),
  EMAIL_SERVER_PORT: z
    .string()
    .transform((val) => Number.parseInt(val))
    .optional(),
  EMAIL_SERVER_USER: z.string().min(1).optional(),
  EMAIL_SERVER_PASSWORD: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Existing variables
  QDRANT_URL: z.string().min(1),
  QDRANT_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
})

// Function to validate environment variables
export function validateEnv() {
  try {
    const parsed = envSchema.safeParse(process.env)

    if (!parsed.success) {
      console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors)
      throw new Error("Invalid environment variables")
    }

    return parsed.data
  } catch (error) {
    console.error("❌ Error validating environment variables:", error)
    throw new Error("Failed to validate environment variables")
  }
}

// For client-side usage (must be prefixed with NEXT_PUBLIC_)
export const publicEnv = {
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
}
