import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * Legacy dashboard route - redirects to /user/dashboard
 */
export default async function DashboardPage() {
  return redirect("/user/dashboard") as any
}
