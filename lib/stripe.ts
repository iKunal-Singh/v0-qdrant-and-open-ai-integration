import Stripe from "stripe"
import { validateEnv } from "@/lib/env"

const env = validateEnv()

let stripe: Stripe | null = null

try {
  if (env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    })
    console.log("Stripe client initialized successfully")
  } else {
    console.warn("Stripe secret key not provided. Stripe functionality will be disabled.")
  }
} catch (error) {
  console.error("Failed to initialize Stripe client:", error)
}

export default stripe
