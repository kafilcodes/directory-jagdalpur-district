import { cookies } from "next/headers"
import { getAdminApp } from "@/lib/firebase/admin"

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (!token) return null
  const admin = getAdminApp()
  try {
    const decoded = await admin.auth().verifyIdToken(token)
    return decoded
  } catch {
    return null
  }
}

export function isAdmin(decoded: any) {
  return !!decoded?.admin
}
