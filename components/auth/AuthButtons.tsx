"use client"
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { useEffect, useMemo, useState } from "react"
import { getFirebaseApp } from "@/lib/firebase/client"

export default function AuthButtons() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const app = useMemo(() => getFirebaseApp(), [])
  const auth = useMemo(() => (app ? getAuth(app) : null), [app])

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
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    })
  }

  const onSignOut = async () => {
    await fetch("/api/auth/session", { method: "DELETE" })
    await signOut(auth)
  }

  return (
    <div className="flex items-center gap-2">
      {userEmail ? (
        <>
          <span className="text-sm text-gray-600">{userEmail}</span>
          <button className="px-3 py-1 rounded-md border" onClick={onSignOut}>Sign out</button>
        </>
      ) : (
        <button className="px-3 py-1 rounded-md border" onClick={onSignIn}>Sign in</button>
      )}
    </div>
  )
}
