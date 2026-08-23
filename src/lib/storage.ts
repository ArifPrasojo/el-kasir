import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

/**
 * Menyimpan file secara lokal ke folder public/uploads
 * @param file File dari FormData
 * @param folder Subfolder penyimpanan (default: "products")
 * @returns Path relatif URL gambar yang bisa diakses via browser
 */
export async function uploadFile(
  file: File,
  folder: string = "products"
): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
  const fileName = `${Date.now()}-${sanitizedFileName}`
  
  // Arahkan ke public/uploads
  const uploadDir = join(process.cwd(), "public", "uploads", folder)
  
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  const filePath = join(uploadDir, fileName)
  await writeFile(filePath, buffer)

  // Kembalikan public url path
  return `/uploads/${folder}/${fileName}`
}
