import ListingFormClient from "@/components/listings/ListingFormClient"
import { uploadAndCreateListing } from "@/app/actions/uploadAndCreateListing"

export const dynamic = "force-dynamic"

export default function SubmitPage() {
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
