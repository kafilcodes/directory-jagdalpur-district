import { getCurrentUser } from "@/lib/auth/server"
import AuthButtons from "@/components/auth/AuthButtons"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const user = await getCurrentUser()
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Your Profile</h1>
        <AuthButtons />
      </div>
      {!user ? (
        <div className="rounded-lg border bg-white p-6 text-gray-600">
          Please sign in to view your profile.
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">UID</div>
              <div className="font-medium break-all">{user.uid}</div>
            </div>
            <div>
              <div className="text-gray-500">Email verified</div>
              <div className="font-medium">{String((user as any).email_verified ?? false)}</div>
            </div>
            <div>
              <div className="text-gray-500">Admin</div>
              <div className="font-medium">{String((user as any).admin ?? false)}</div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}