import admin from "firebase-admin"

function requireEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function initAdmin() {
  if (admin.apps.length) return admin.app()
  const projectId = requireEnv("FIREBASE_ADMIN_PROJECT_ID")
  const clientEmail = requireEnv("FIREBASE_ADMIN_CLIENT_EMAIL")
  const privateKey = requireEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n")
  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) })
  return admin.app()
}

async function main() {
  const uid = process.argv[2]
  if (!uid) throw new Error("Usage: node tools/admin/set-admin-claim.mjs <uid>")
  initAdmin()
  await admin.auth().setCustomUserClaims(uid, { admin: true })
  console.log(`Set admin=true for uid=${uid}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
