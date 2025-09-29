import admin from "firebase-admin"
import type { SearchShardDoc } from "@/lib/types"

function requireEnv(name: string) {
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

function shardIdFor(term: string): string {
  const c = term[0]
  return (c >= 'a' && c <= 'z') ? `index_${c}` : "index_other"
}

function toWords(q: string): string[] {
  return Array.from(new Set(q.toLowerCase().trim().split(/[^a-z0-9]+/).filter(Boolean)))
}

async function main() {
  initAdmin()
  const db = admin.firestore()
  const listings = await db.collection("listings").get()

  const shards: Record<string, SearchShardDoc> = {}

  listings.docs.forEach((d) => {
    const data = d.data() as any
    const id = d.id
    const terms = Array.from(new Set([
      ...toWords(String(data.businessName || data.name || "")),
      ...toWords(String(data.categorySlug || data.category || "")),
    ]))
    for (const term of terms) {
      const shardId = shardIdFor(term)
      const shard = (shards[shardId] = shards[shardId] || { index: {} })
      const bucket = (shard.index[term] = shard.index[term] || {})
      const created = Number((data.createdAt && (data.createdAt as any).toMillis ? (data.createdAt as any).toMillis() : data.createdAt) ?? Date.now())
      bucket[id] = {
        score: 10,
        name: String(data.businessName || data.name || "Unnamed"),
        cat: String(data.categorySlug || data.category || "general"),
        imp: 0,
        clk: 0,
        createdAt: created,
        updatedAt: created,
      }
    }
  })

  // Write shards
  for (const [shardId, payload] of Object.entries(shards)) {
    await db.collection("search").doc(shardId).set(payload, { merge: true })
    console.log("wrote shard", shardId, Object.keys(payload.index).length, "terms")
  }

  console.log("Backfill complete")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

