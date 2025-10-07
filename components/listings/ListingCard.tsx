import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Star, Phone, Mail } from "lucide-react"
import Image from "next/image"
import { CategoryBadge } from "../common/CategoryBadge"

export type ListingCardProps = {
  id: string
  name: string
  category: string
  address: string
  rating?: number
  photoUrl?: string
  thumbnail?: string
  images?: string[]
  googlePhotos?: string[]
  phone?: string
  email?: string
  planType?: "featured" | "sponsored"
}

export function ListingCard({
  id,
  name,
  category,
  address,
  rating,
  photoUrl,
  thumbnail,
  images,
  googlePhotos,
  phone,
  email,
  planType
}: ListingCardProps) {
  // Prioritize images for thumbnail display
  const displayImage = thumbnail || images?.[0] || googlePhotos?.[0] || photoUrl

  // Clean address - remove Dhamtari, Chhattisgarh, Pincode, India
  const cleanAddress = address
    ?.replace(/,?\s*Dhamtari,?\s*/gi, '')
    ?.replace(/,?\s*Chhattisgarh,?\s*/gi, '')
    ?.replace(/,?\s*India,?\s*/gi, '')
    ?.replace(/,?\s*\d{6},?\s*/g, '') // Remove 6-digit pincodes
    ?.trim()
    ?.replace(/^,|,$/g, '') // Remove leading/trailing commas
    ?.trim() || address

  return (
    <Card className="group bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-300 cursor-pointer">
      {/* Image - reduced size */}
      {displayImage ? (
        <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
          <Image
            src={displayImage}
            alt={name}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Plan badges on image - top right - only for paid plans */}
          {planType === "featured" && (
            <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
              ★
            </div>
          )}
          {planType === "sponsored" && (
            <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
              S
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-40 w-full bg-gray-100 flex items-center justify-center">
          <Building2 className="h-12 w-12 text-gray-300" aria-hidden="true" />
          {planType === "featured" && (
            <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
              ★
            </div>
          )}
          {planType === "sponsored" && (
            <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
              S
            </div>
          )}
        </div>
      )}

      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold line-clamp-1">{name}</CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0 space-y-2">
        {/* Category with icon using modular component */}
        <CategoryBadge
          category={category}
          variant="secondary"
          showText={true}
          showIcon={true}
          iconSize="h-3 w-3"
          className="text-xs"
        />

        {/* Address - smaller font, no rating */}
        {cleanAddress && (
          <div className="flex items-start gap-1 text-[10px] text-gray-500 leading-tight">
            <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-red-500" aria-hidden="true" />
            <p className="line-clamp-2 text-xs">{cleanAddress}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
