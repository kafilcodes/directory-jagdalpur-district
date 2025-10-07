import "server-only"
import admin from "firebase-admin"
import fs from "fs"
import path from "path"

function init() {
  if (admin.apps.length) return

  // Prefer local service account JSON in project root
  const jsonPath = path.resolve(process.cwd(), "dhamtaridirectory-firebase-adminsdk-fbsvc-f4c6eabb2e.json")
  let credential: admin.credential.Credential | null = null
  let storageBucket: string | undefined = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, "utf-8")
      const svc = JSON.parse(raw)
      credential = admin.credential.cert(svc as admin.ServiceAccount)
      // If JSON includes storageBucket, prefer it
      if (!storageBucket && typeof svc.storageBucket === "string") storageBucket = svc.storageBucket
    } catch (err) {
      throw new Error(`Failed to read Firebase Admin service account JSON at ${jsonPath}: ${String(err)}`)
    }
  } else {
    // Fallback to env vars for local/dev where JSON is not present
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")
    if (projectId && clientEmail && privateKey) {
      credential = admin.credential.cert({ projectId, clientEmail, privateKey })
    }
  }

  if (!credential) {
    throw new Error("Missing Firebase Admin credentials: place service account JSON in project root or set FIREBASE_ADMIN_* env vars")
  }

  // Get project ID from credential or env
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dhamtaridirectory'

  admin.initializeApp({
    credential,
    storageBucket,
    projectId, // Explicitly set project ID
    databaseURL: `https://${projectId}.firebaseio.com`, // Required for some Firebase services
  })

  // Configure Firestore settings ONCE during initialization
  try {
    const db = admin.firestore()

    // CRITICAL: Set the database ID for custom Firestore databases
    const databaseId = process.env.FIREBASE_DATABASE_ID || 'dhamtaridirectory'

    db.settings({
      ignoreUndefinedProperties: true,
      // For custom database IDs (not "(default)"), specify it here
      databaseId: databaseId,
    })
  } catch (err) {
    // Settings can only be called once, ignore if already set
    console.log('Firestore settings already configured:', err)
  }
}

export function getAdminApp() {
  init()
  return admin.app()
}

export function getAdminDb() {
  init()

  // Database ID is already configured in settings during init()
  // Just return the Firestore instance
  return admin.firestore()
}

export function getAdminBucket() {
  init()
  return admin.storage().bucket()
}

export const FieldValue = admin.firestore.FieldValue
