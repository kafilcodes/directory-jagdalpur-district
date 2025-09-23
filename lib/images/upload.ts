import { getAdminBucket } from "@/lib/firebase/admin"
import { nanoid } from "nanoid"

export async function uploadImage(buffer: Buffer, contentType: string, pathPrefix = "uploads") {
  const bucket = getAdminBucket()
  const id = nanoid()
  const filePath = `${pathPrefix}/${id}.jpg`
  const file = bucket.file(filePath)
  await file.save(buffer, { contentType, resumable: false, public: true })
  await file.makePublic().catch(() => {})
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`
  return { id, publicUrl, filePath }
}
