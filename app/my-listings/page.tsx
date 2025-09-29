import { redirect } from "next/navigation"

export default function MyListingsRootRedirect() {
  // Keep URL stable for users who type /my-listings directly
  redirect("/dashboard/my-listings")
}

