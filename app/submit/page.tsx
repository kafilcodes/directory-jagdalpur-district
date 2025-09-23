import ListingFormClient from "@/components/listings/ListingFormClient"
import { uploadAndCreateListing } from "@/app/actions/uploadAndCreateListing"

export const dynamic = "force-dynamic"

export default function SubmitPage() {
  return (
    <main className="mx-auto max-w-3xl p-4 space-y-4">
      <h1 className="text-2xl font-bold">Submit your listing</h1>
      <ListingFormClient action={uploadAndCreateListing} />
    </main>
  )
}
