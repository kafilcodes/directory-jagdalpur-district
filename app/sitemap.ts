import type { MetadataRoute } from "next"
import { getAdminDb } from "@/lib/firebase/admin"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"

  // Default entries
  const entries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/dashboard`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.3 },
  ]

  // If Firebase Admin is configured, include listing URLs
  if (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    try {
      const db = getAdminDb()
      const snap = await db.collection("listings").where("approved", "==", true).limit(1000).get()
      for (const doc of snap.docs) {
        entries.push({
          url: `${baseUrl}/listing/${doc.id}`,
          lastModified: new Date(Number((doc.data() as any)?.updatedAt || Date.now())),
          changeFrequency: "weekly",
          priority: 0.7,
        })
      }
    } catch {
      // ignore errors
    }
  }

  return entries
}
