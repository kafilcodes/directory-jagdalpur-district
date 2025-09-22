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
  initAdmin()
  const db = admin.firestore()
  const now = Date.now()
  const batch = db.batch()

  const samples = [
    { id: "sample-1", name: "Sharma Cafe", category: "Cafes", address: "Main Road, Dhamtari", rating: 4.5 },
    { id: "sample-2", name: "Gupta Electronics", category: "Electricians", address: "Market Square", rating: 4.2 },
    { id: "sample-3", name: "City Gym", category: "Gyms", address: "Ring Road", rating: 4.0 },
  ]

  for (const s of samples) {
    batch.set(db.collection("listings").doc(s.id), {
      id: s.id,
      name: s.name,
      category: s.category,
      address: s.address,
      rating: s.rating,
      approved: true,
      createdAt: now,
      updatedAt: now,
    })
  }

  await batch.commit()
  console.log("Seeded listings: ", samples.map((s) => s.id).join(", "))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
