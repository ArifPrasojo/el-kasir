import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadFile } from "@/lib/storage"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "products"

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, and WebP images are allowed" }, { status: 400 })
    }

    const fileUrl = await uploadFile(file, folder)

    return NextResponse.json({ fileUrl })
  } catch (error) {
    console.error("POST /api/upload error:", error)
    return NextResponse.json({ error: "Gagal mengupload file" }, { status: 500 })
  }
}
