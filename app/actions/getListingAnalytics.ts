"use server"

import { adminDb } from "@/lib/firebase/admin"

export async function getListingAnalytics(id: string) {
  const q = await adminDb
    .collection("analyticsEvents")
    .where("listingId", "==", id)
    .orderBy("timestamp", "desc")
    .limit(1000)
    .get()
  return q.docs.map((d) => d.data())
}
