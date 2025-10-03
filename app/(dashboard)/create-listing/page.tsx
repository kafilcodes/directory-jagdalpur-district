import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * Legacy create-listing route - redirects to /user/create-listing
 */
export default async function CreateListingPage() {
  return redirect("/user/create-listing") as any
}

