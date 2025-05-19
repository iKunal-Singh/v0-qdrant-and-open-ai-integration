import type { NextRequest } from "next/server"
import { PDFDocument } from "pdf-lib"
import sharp from "sharp"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pageNumber = Number.parseInt(request.nextUrl.searchParams.get("page") || "1")
    const width = Number.parseInt(request.nextUrl.searchParams.get("width") || "200")

    // For now, we'll generate a placeholder thumbnail
    // In a real implementation, you would:
    // 1. Retrieve the document from storage
    // 2. Extract the specified page
    // 3. Render it as an image

    // Create a simple PDF with text
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([width, width * 1.4]) // Approximate aspect ratio

    const { width: pageWidth, height: pageHeight } = page.getSize()

    // Add some text
    page.drawText(`Document: ${params.id}`, {
      x: 20,
      y: pageHeight - 40,
      size: 12,
    })

    page.drawText(`Page: ${pageNumber}`, {
      x: 20,
      y: pageHeight - 60,
      size: 12,
    })

    // Add a border
    page.drawRectangle({
      x: 5,
      y: 5,
      width: pageWidth - 10,
      height: pageHeight - 10,
      borderWidth: 1,
      borderColor: { r: 0, g: 0, b: 0 },
    })

    // Save the PDF
    const pdfBytes = await pdfDoc.save()

    // Convert PDF to PNG using sharp
    const pngBuffer = await sharp(Buffer.from(pdfBytes))
      .resize(width, Math.round(width * 1.4))
      .png()
      .toBuffer()

    return new Response(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (error) {
    console.error("Error generating thumbnail:", error)

    // Return a fallback image
    const fallbackSvg = `<svg width="200" height="280" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="280" fill="#f0f0f0" />
      <text x="100" y="140" font-family="Arial" font-size="14" text-anchor="middle">Thumbnail Error</text>
    </svg>`

    return new Response(fallbackSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
      },
    })
  }
}
