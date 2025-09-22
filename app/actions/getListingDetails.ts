"use server"

import { getAdminDb } from "@/lib/firebase/admin"

export async function getListingDetails(id: string) {
  const db = getAdminDb()
  const snap = await db.collection("listings").doc(id).get()
  if (!snap.exists) return null
  return snap.data()
}
