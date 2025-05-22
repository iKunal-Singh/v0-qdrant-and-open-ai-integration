import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)

  // Return session info (safe to expose)
  return NextResponse.json({
    authenticated: !!session,
    session: session
      ? {
          user: {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            role: session.user.role,
          },
          expires: session.expires,
        }
      : null,
  })
}
