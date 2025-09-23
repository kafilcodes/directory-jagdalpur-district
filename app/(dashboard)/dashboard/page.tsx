import { getAdminDb } from "@/lib/firebase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import RazorpayCheckoutButton from "@/components/payments/RazorpayCheckoutButton"
import AuthButtons from "@/components/auth/AuthButtons"

type EventItem = { type: string; timestamp: number; listingId?: string | null; path?: string | null }

async function getStats() {
  const db = getAdminDb()
  const snap = await db.collection("analyticsEvents").orderBy("timestamp", "desc").limit(50).get()
  const total = snap.size
  const counts: Record<string, number> = {}
  const events: EventItem[] = []
  snap.docs.forEach((d) => {
    const data = d.data() as any
    const t = data?.type || "unknown"
    counts[t] = (counts[t] || 0) + 1
    events.push({ type: t, timestamp: Number(data?.timestamp || 0), listingId: data?.listingId || null, path: data?.path || null })
  })
  return { total, counts, events }
}

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { total, counts, events } = await getStats()

  return (
    <main className="mx-auto max-w-5xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Provider Dashboard</h1>
        <AuthButtons />
      </div>

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

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity (last 50)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Listing</th>
                    <th className="py-2 pr-4">Path</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="py-2 pr-4">{new Date(e.timestamp).toISOString()}</td>
                      <td className="py-2 pr-4 capitalize">{e.type}</td>
                      <td className="py-2 pr-4">{e.listingId || "-"}</td>
                      <td className="py-2 pr-4">{e.path || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test Payment</CardTitle>
          </CardHeader>
          <CardContent>
<RazorpayCheckoutButton amount={50000} label="Pay ₹500" />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
