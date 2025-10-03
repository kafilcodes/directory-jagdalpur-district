import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * Legacy profile route - redirects to /user/profile
 */
export default async function ProfilePage() {
  return redirect("/user/profile") as any
}
