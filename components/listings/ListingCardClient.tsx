"use client"
import { ListingCard, type ListingCardProps } from "@/components/listings/ListingCard"
import { useCallback } from "react"

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

    // Navigate to the dedicated details page while also supporting sheet on homepage
    const isHome = window.location.pathname === "/"
    if (isHome) {
      url.searchParams.set("id", props.id)
      window.history.replaceState({}, "", url.toString())
    } else {
      window.location.href = `/listing/${props.id}`
    }

    // Existing analytics event
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "listing.open", listingId: props.id, path: window.location.pathname }),
        keepalive: true,
      })
    } catch { }
  }, [props.id])

  return (
    <button
      onClick={onClick}
      className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded-lg cursor-pointer"
      aria-label={`Open listing ${props.name}`}
    >
      <ListingCard {...props} />
    </button>
  )
}
