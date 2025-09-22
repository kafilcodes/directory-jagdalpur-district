"use client"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

export default function ListingDetailSheet() {
  const sp = useSearchParams()
  const id = useMemo(() => sp.get("id") || "", [sp])
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const active = !!id
    setOpen(active)
    if (!active) return
    setLoading(true)
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((j) => setData(j?.data || null))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{data?.name || data?.listingName || (loading ? "Loading..." : "Details")}</SheetTitle>
        </SheetHeader>
        {loading ? (
          <div className="space-y-3 mt-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : data ? (
          <div className="mt-4 space-y-2 text-sm text-gray-700">
            {data.address && <p>{data.address}</p>}
            {data.phone && <p>Phone: {data.phone}</p>}
            {data.email && <p>Email: {data.email}</p>}
            {data.website && (
              <p>
                Website: <a className="text-accent-600 underline" href={data.website} target="_blank" rel="noreferrer">{data.website}</a>
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 text-sm text-gray-500">No details found.</div>
        )}
      </SheetContent>
    </Sheet>
  )
}
