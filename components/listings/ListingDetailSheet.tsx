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
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-white">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold tracking-tight">
            {data?.name || data?.listingName || (loading ? "Loading..." : "Details")}
          </SheetTitle>
        </SheetHeader>
        {loading ? (
          <div className="space-y-3 mt-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : data ? (
          <div className="mt-4 space-y-4 text-sm text-gray-700">
            {data.address && (
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Address</div>
                <p>{data.address}</p>
              </div>
            )}
            {data.phone && (
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Phone</div>
                <p>{data.phone}</p>
              </div>
            )}
            {data.email && (
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Email</div>
                <p>{data.email}</p>
              </div>
            )}
            {data.website && (
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Website</div>
                <a className="text-accent-600 underline" href={data.website} target="_blank" rel="noreferrer">
                  {data.website}
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 text-sm text-gray-500">No details found.</div>
        )}
      </SheetContent>
    </Sheet>
  )
}
