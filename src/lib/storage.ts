import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = process.env.S3_ENDPOINT
  ? new S3Client({
      region: "auto",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
      },
    })
  : null

export async function getUploadUrl(
  fileName: string,
  contentType: string,
  folder: string = "products"
): Promise<{ uploadUrl: string; fileUrl: string } | null> {
  if (!s3Client || !process.env.S3_BUCKET) {
    console.warn("S3 not configured - file upload disabled")
    return null
  }

  const key = `${folder}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 })
  const fileUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`

  return { uploadUrl, fileUrl }
}
