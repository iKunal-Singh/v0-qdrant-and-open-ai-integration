"use server"

import { hash } from "bcryptjs"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { logAuthEvent } from "@/lib/auth" // Adjust path if necessary

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
})

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    // Validate input
    const result = registerSchema.safeParse({ name, email, password })

    if (!result.success) {
      return {
        success: false,
        error: result.error.errors[0].message,
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists",
      }
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
    })

    return {
      success: true,
      message: "Registration successful",
    }
  } catch (error) {
    logAuthEvent("User registration error", {
      name: formData.get("name"),
      email: formData.get("email"),
      errorMessage: error instanceof Error ? error.message : String(error),
      // stack: error instanceof Error ? error.stack : undefined, // Optionally add stack
    });
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    }
  }
}
