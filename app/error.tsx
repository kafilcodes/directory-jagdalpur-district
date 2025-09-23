"use client"
import React from "react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl p-6 text-center space-y-3">
      <h2 className="text-2xl font-bold">Something went wrong</h2>
      <p className="text-gray-600">{error?.message || "Unexpected error"}</p>
      {error?.digest && <p className="text-gray-400 text-xs">{error.digest}</p>}
      <button
        onClick={() => reset()}
        className="mt-3 inline-flex items-center rounded-md bg-accent-500 px-4 py-2 text-white"
      >
        Try again
      </button>
    </div>
  )
}
