import { NextResponse } from "next/server"
import { performAuthHealthCheck } from "@/lib/auth-validation"

export async function GET() {
  try {
    const healthCheck = await performAuthHealthCheck()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: healthCheck.overall.isValid ? "healthy" : "unhealthy",
      ...healthCheck,
    })
  } catch (error) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
