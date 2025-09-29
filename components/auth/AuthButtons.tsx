"use client"
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { getFirestore, collection, query, where, limit, getDocs } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { getFirebaseApp } from "@/lib/firebase/client"

export default function AuthButtons() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const app = useMemo(() => getFirebaseApp(), [])
  const auth = useMemo(() => (app ? getAuth(app) : null), [app])
  const router = useRouter()

  // Always call hooks; guard inside them
  useEffect(() => {
    if (!auth) return
    return auth.onAuthStateChanged((u) => setUserEmail(u?.email || null))
  }, [auth])

  // Hide the auth UI entirely if client env is not configured
  if (!auth) return null

  const onSignIn = async () => {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    const idToken = await cred.user.getIdToken()
    const resp = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    })
    if (!resp.ok) return
    // Decide redirect by checking if listing exists
    const db = getFirestore(app!)
    try {
      const q = query(collection(db, "listings"), where("ownerId", "==", cred.user.uid), limit(1))
      const snap = await getDocs(q)
      router.push(!snap.empty ? "/dashboard/my-listings" : "/submit")
    } catch {
      router.push("/submit")
    }
  }

  const onSignOut = async () => {
    await fetch("/api/auth/session", { method: "DELETE" })
    await signOut(auth)
  }

  return (
    <div className="flex items-center gap-2">
      {userEmail ? (
        <>
          <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[140px]">{userEmail}</span>
          <button className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs sm:text-sm shadow-sm hover:bg-gray-50" onClick={onSignOut} aria-label="Sign out">
            Sign out
          </button>
        </>
      ) : (
        <button className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs sm:text-sm shadow-sm hover:bg-gray-50" onClick={onSignIn} aria-label="Sign in with Google">
          {/* <span className="inline-block h-4 w-4 bg-[url('data:image/svg+xml;utf8,<svg xmlns=\" http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><path fill=\"%23FFC107\" d=\"M43.611 20.083H42V20H24v8h11.303C33.64 31.91 29.223 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.675 4.051 29.569 2 24 2 12.955 2 4 10.955 4 22s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z\"/><path fill=\"%2343A047\" d=\"M6.306 14.691l6.571 4.815C14.297 16.061 18.777 13 24 13c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.675 4.051 29.569 2 24 2 16.318 2 9.656 6.337 6.306 14.691z\"/><path fill=\"%2300BCD4\" d=\"M24 42c5.166 0 9.86-1.977 13.388-5.205l-6.167-5.206C29.22 33.91 25.03 35 24 35c-5.21 0-9.62-3.08-11.29-7.384l-6.57 5.058C8.454 38.722 15.63 42 24 42z\"/><path fill=\"%23F44336\" d=\"M43.611 20.083H42V20H24v8h11.303C34.64 31.91 29.223 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.675 4.051 29.569 2 24 2c-7.682 0-14.344 4.337-17.694 12.691l-.001.001 6.571 4.815C14.297 16.061 18.777 13 24 13c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.675 4.051 29.569 2 24 2 12.955 2 4 10.955 4 22s8.955 20 20 20c9.261 0 17.039-5.94 19.611-14.083z\"/></svg>')] bg-no-repeat bg-center" /> */}
          <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.64 31.91 29.223 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.675 4.051 29.569 2 24 2 12.955 2 4 10.955 4 22s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z" />
            <path fill="#43A047" d="M6.306 14.691l6.571 4.815C14.297 16.061 18.777 13 24 13c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.675 4.051 29.569 2 24 2 16.318 2 9.656 6.337 6.306 14.691z" />
            <path fill="#00BCD4" d="M24 42c5.166 0 9.86-1.977 13.388-5.205l-6.167-5.206C29.22 33.91 25.03 35 24 35c-5.21 0-9.62-3.08-11.29-7.384l-6.57 5.058C8.454 38.722 15.63 42 24 42z" />
            <path fill="#F44336" d="M43.611 20.083H42V20H24v8h11.303C34.64 31.91 29.223 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.675 4.051 29.569 2 24 2 12.955 2 4 10.955 4 22s8.955 20 20 20c9.261 0 17.039-5.94 19.611-14.083z" />
          </svg>

          Sign in with Google
        </button>
      )}
    </div>
  )
}
