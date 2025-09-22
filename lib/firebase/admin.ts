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

export const FieldValue = admin.firestore.FieldValue
