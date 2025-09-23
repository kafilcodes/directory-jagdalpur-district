"use server"

import { getAdminDb } from "@/lib/firebase/admin"

export async function toggleApproval(formData: FormData) {
  const id = String(formData.get("id") || "")
  const approve = String(formData.get("approve") || "false") === "true"
  if (!id) return
  const db = getAdminDb()
  await db.collection("listings").doc(id).update({ approved: approve, updatedAt: Date.now() })

  // Try Algolia sync if configured
  try {
    if (process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_API_KEY && process.env.ALGOLIA_INDEX) {
      const mod: any = await import("algoliasearch")
      const client = (mod.default || mod.algoliasearch)(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_API_KEY!)
      const index = client.initIndex(process.env.ALGOLIA_INDEX!)
      if (approve) {
        const snap = await db.collection("listings").doc(id).get()
        if (snap.exists) {
          const data = snap.data() as any
          await index.saveObject({ objectID: id, ...data })
        }
      } else {
        await index.deleteObject(id)
      }
    }
  } catch {}
}
