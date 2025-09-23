"use client"
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { useEffect, useState } from "react"
import { firebaseApp } from "@/lib/firebase/client"

export default function AuthButtons() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const auth = getAuth(firebaseApp)

  useEffect(() => {
    return auth.onAuthStateChanged((u) => setUserEmail(u?.email || null))
  }, [auth])

  const onSignIn = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const onSignOut = async () => {
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
