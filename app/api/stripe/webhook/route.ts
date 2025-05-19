import { headers } from "next/headers"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import stripe from "@/lib/stripe"
import { validateEnv } from "@/lib/env"

const env = validateEnv()

export async function POST(req: Request) {
  try {
    if (!stripe) {
      console.error("Stripe is not configured")
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 })
    }

    const body = await req.text()
    const signature = headers().get("stripe-signature") as string

    if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any
        const userId = session.metadata.userId
        const customerId = session.customer
        const subscriptionId = session.subscription

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0].price.id

        // Update or create subscription in database
        await prisma.subscription.upsert({
          where: {
            userId,
          },
          update: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            status: subscription.status.toUpperCase(),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
          create: {
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            status: subscription.status.toUpperCase(),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })

        // Create payment record
        await prisma.payment.create({
          data: {
            userId,
            amount: session.amount_total,
            currency: session.currency,
            status: "COMPLETED",
            stripeId: session.id,
          },
        })

        break
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription
        const customerId = invoice.customer

        // Get user ID from customer
        const customer = await stripe.customers.retrieve(customerId)
        const userId = customer.metadata.userId

        if (!userId) {
          console.error("User ID not found in customer metadata")
          break
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0].price.id

        // Update subscription in database
        await prisma.subscription.update({
          where: {
            userId,
          },
          data: {
            status: subscription.status.toUpperCase(),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            stripePriceId: priceId,
          },
        })

        // Create payment record
        await prisma.payment.create({
          data: {
            userId,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: "COMPLETED",
            stripeId: invoice.id,
          },
        })

        break
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as any
        const customerId = subscription.customer

        // Get user ID from customer
        const customer = await stripe.customers.retrieve(customerId)
        const userId = customer.metadata.userId

        if (!userId) {
          console.error("User ID not found in customer metadata")
          break
        }

        // Update subscription in database
        await prisma.subscription.update({
          where: {
            userId,
          },
          data: {
            status: subscription.status.toUpperCase(),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })

        break
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any
        const customerId = subscription.customer

        // Get user ID from customer
        const customer = await stripe.customers.retrieve(customerId)
        const userId = customer.metadata.userId

        if (!userId) {
          console.error("User ID not found in customer metadata")
          break
        }

        // Update subscription in database
        await prisma.subscription.update({
          where: {
            userId,
          },
          data: {
            status: "CANCELED",
          },
        })

        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Stripe webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
