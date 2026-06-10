import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUploadUrl } from "@/lib/storage"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const { fileName, contentType, folder } = body

    if (!fileName || !contentType) {
      return NextResponse.json({ error: "fileName and contentType are required" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: "Only JPEG, PNG, and WebP images are allowed" }, { status: 400 })
    }

    const result = await getUploadUrl(fileName, contentType, folder || "products")
    if (!result) {
      return NextResponse.json({ error: "File storage not configured" }, { status: 503 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("POST /api/upload error:", error)
    return NextResponse.json({ error: "Gagal mengupload file" }, { status: 500 })
  }
}
