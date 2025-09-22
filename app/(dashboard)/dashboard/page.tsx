import { getAdminDb } from "@/lib/firebase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

async function getStats() {
  const db = getAdminDb()
  // For now: total events in last N items
  const snap = await db.collection("analyticsEvents").orderBy("timestamp", "desc").limit(50).get()
  const total = snap.size
  // naive type counts
  const counts: Record<string, number> = {}
  snap.docs.forEach((d) => {
    const t = (d.data() as any)?.type || "unknown"
    counts[t] = (counts[t] || 0) + 1
  })
  return { total, counts }
}

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { total, counts } = await getStats()

  return (
    <main className="mx-auto max-w-5xl p-4 space-y-4">
      <h1 className="text-2xl font-bold">Provider Dashboard</h1>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Events</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{total}</CardContent>
        </Card>
        {Object.entries(counts).slice(0, 2).map(([k, v]) => (
          <Card key={k}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base capitalize">{k}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{v}</CardContent>
          </Card>
        ))}
      </section>

      <Separator />

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity (last 50)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">This will show a table of recent events (TBD).</div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
