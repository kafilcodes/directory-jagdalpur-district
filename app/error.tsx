"use client"
import React from "react"

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html>
      <body>
        <div className="mx-auto max-w-xl p-6 text-center space-y-3">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-gray-600">{error?.message || "Unexpected error"}</p>
          <p className="text-gray-400 text-xs">{error?.digest}</p>
        </div>
      </body>
    </html>
  )
}
