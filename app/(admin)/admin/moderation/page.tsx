import { getAdminDb } from "@/lib/firebase/admin"
import { getCurrentUser, isAdmin } from "@/lib/auth/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AuthButtons from "@/components/auth/AuthButtons"
import { Button } from "@/components/ui/button"

async function getListings() {
  const db = getAdminDb()
  const pendingSnap = await db.collection("listings").where("approved", "==", false).orderBy("createdAt", "desc").limit(50).get()
  const approvedSnap = await db.collection("listings").where("approved", "==", true).orderBy("createdAt", "desc").limit(50).get()
  return {
    pending: pendingSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
    approved: approvedSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
  }
}

export const dynamic = "force-dynamic"

export default async function ModerationPage() {
  const user = await getCurrentUser()
  if (!user || !isAdmin(user)) {
    return (
      <main className="mx-auto max-w-5xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Moderation</h1>
          <AuthButtons />
        </div>
        <p className="text-gray-600">Admin access required.</p>
      </main>
    )
  }

  const { pending, approved } = await getListings()

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Admin Moderation</h1>
        <AuthButtons />
      </div>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Pending approval ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pending.map((l: any) => (
                <form key={l.id} action={require("@/app/(admin)/admin/moderation/toggle").toggleApproval} className="flex items-center justify-between border p-3 rounded-md bg-white">
                  <div>
                    <div className="font-medium">{l.name || l.listingName || l.id}</div>
                    <div className="text-sm text-gray-500">{l.category || l.listingType}</div>
                  </div>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="approve" value="true" />
                  <Button type="submit">Approve</Button>
                </form>
              ))}
              {pending.length === 0 && <div className="text-sm text-gray-500">No pending items.</div>}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Approved ({approved.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {approved.map((l: any) => (
                <form key={l.id} action={require("@/app/(admin)/admin/moderation/toggle").toggleApproval} className="flex items-center justify-between border p-3 rounded-md bg-white">
                  <div>
                    <div className="font-medium">{l.name || l.listingName || l.id}</div>
                    <div className="text-sm text-gray-500">{l.category || l.listingType}</div>
                  </div>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="approve" value="false" />
                  <Button variant="secondary" type="submit">Unapprove</Button>
                </form>
              ))}
              {approved.length === 0 && <div className="text-sm text-gray-500">No approved items.</div>}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
