import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * Legacy my-listing route - redirects to /user/my-listing
 */
export default async function MyListingPage() {
  return redirect("/user/my-listing") as any
}
