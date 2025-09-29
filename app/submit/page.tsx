import ListingFormClient from "@/components/listings/ListingFormClient"
import { uploadAndCreateListing } from "@/app/actions/uploadAndCreateListing"
import { getCurrentUser } from "@/lib/auth/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

async function userHasListing(uid: string) {
  try {
    const db = getAdminDb()
    const snap = await db.collection("listings").where("ownerId", "==", uid).limit(1).get()
    return snap.size > 0
  } catch {
    return false
  }
}

export default async function SubmitPage() {
  const user = await getCurrentUser()
  if (!user) return redirect("/") as any

  if (await userHasListing(user.uid)) {
    return redirect("/dashboard/my-listings") as any
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Submit your listing</h1>
        <p className="text-gray-600">Share details about your business. Submissions require admin approval.</p>
      </div>
      <div className="rounded-lg border bg-white p-6">
        <ListingFormClient action={uploadAndCreateListing} />
      </div>
    </main>
  )
}
