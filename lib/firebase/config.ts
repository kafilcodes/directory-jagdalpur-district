import { getFirebaseApp } from "@/lib/firebase/client"
import { getAdminApp, getAdminDb, getAdminBucket } from "@/lib/firebase/admin"

export function getServerDb() {
  return getAdminDb()
}

export function getServerApp() {
  return getAdminApp()
}

export function getServerBucket() {
  return getAdminBucket()
}

export function getClientApp() {
  return getFirebaseApp()
}

