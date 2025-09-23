import "server-only"
import admin from "firebase-admin"

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")

function init() {
  if (!admin.apps.length) {
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing Firebase Admin env vars")
    }
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  }
}

export function getAdminApp() {
  init()
  return admin.app()
}

export function getAdminDb() {
  init()
  return admin.firestore()
}

export function getAdminBucket() {
  init()
  return admin.storage().bucket()
}

export const FieldValue = admin.firestore.FieldValue
