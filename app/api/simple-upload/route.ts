import type { NextRequest } from "next/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  console.log("Simple upload API called")

  try {
    // Basic form data parsing
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      console.log("No file provided")
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Log file details
    console.log(`File received: ${file.name}, size: ${file.size} bytes, type: ${file.type}`)

    // Simply return success without any processing
    return new Response(
      JSON.stringify({
        success: true,
        message: `File ${file.name} received successfully`,
        fileSize: file.size,
        fileType: file.type,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    // Log the error
    console.error("Simple upload error:", error)

    // Return a basic error response
    return new Response(
      JSON.stringify({
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
