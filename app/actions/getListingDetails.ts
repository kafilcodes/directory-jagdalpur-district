"use server"

import { adminDb } from "@/lib/firebase/admin"

export async function getListingDetails(id: string) {
  const snap = await adminDb.collection("listings").doc(id).get()
  if (!snap.exists) return null
  return snap.data()
}
