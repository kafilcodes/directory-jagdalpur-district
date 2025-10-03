"use client"
import * as React from "react"

export default function ListingEventTracker({ listingId }: { listingId: string }) {
  const sentRef = React.useRef(false)
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!ref.current || sentRef.current) return
    const el = ref.current
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !sentRef.current) {
          sentRef.current = true
          try {
            fetch("/api/events/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "view", listingId, meta: { path: window.location.pathname } }),
              keepalive: true,
            })
          } catch {}
          io.disconnect()
        }
      })
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [listingId])

  return <div ref={ref} aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, pointerEvents: "none", opacity: 0 }} />
}

