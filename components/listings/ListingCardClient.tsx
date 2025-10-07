"use client"
import { ListingCard, type ListingCardProps } from "@/components/listings/ListingCard"
import { useCallback } from "react"
import ListingEventTracker from "@/components/listings/ListingEventTracker"

export default function ListingCardClient(props: ListingCardProps) {
  const onClick = useCallback(() => {
    const url = new URL(window.location.href)

    // Fire-and-forget: search click tracking if coming from /search with q
    const q = url.searchParams.get("q")
    if (window.location.pathname === "/search" && q) {
      try {
        fetch("/api/search-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: props.id, q }),
          keepalive: true,
        })
      } catch { }
    }

    // Always open sheet by setting id parameter
    url.searchParams.set("id", props.id)
    window.history.replaceState({}, "", url.toString())

    // Existing analytics event + new click capture
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "listing.open", listingId: props.id, path: window.location.pathname }),
        keepalive: true,
      })
      fetch("/api/events/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "click", listingId: props.id, meta: { path: window.location.pathname } }),
        keepalive: true,
      })
    } catch { }
  }, [props.id])

  return (
    <button
      onClick={onClick}
      className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded-lg cursor-pointer relative"
      aria-label={`Open listing ${props.name}`}
    >
      <ListingCard {...props} />
      <ListingEventTracker listingId={props.id} />
    </button>
  )
}
