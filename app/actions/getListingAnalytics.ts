"use server"

import { getAdminDb } from "@/lib/firebase/admin"

export async function getListingAnalytics(id: string) {
  const db = getAdminDb()
  const q = await db
    .collection("analyticsEvents")
    .where("listingId", "==", id)
    .orderBy("timestamp", "desc")
    .limit(1000)
    .get()
  return q.docs.map((d) => d.data())
}
