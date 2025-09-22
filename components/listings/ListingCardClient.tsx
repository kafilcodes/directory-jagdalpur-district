"use client"
import { ListingCard, type ListingCardProps } from "@/components/listings/ListingCard"
import { useCallback } from "react"

export default function ListingCardClient(props: ListingCardProps) {
  const onClick = useCallback(() => {
    // Update URL param to open the detail sheet
    const url = new URL(window.location.href)
    url.searchParams.set("id", props.id)
    window.history.replaceState({}, "", url.toString())

    // Fire-and-forget tracking
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "listing.open", listingId: props.id, path: window.location.pathname }),
        keepalive: true,
      })
    } catch {}
  }, [props.id])

  return (
    <button onClick={onClick} className="text-left w-full">
      <ListingCard {...props} />
    </button>
  )
}
