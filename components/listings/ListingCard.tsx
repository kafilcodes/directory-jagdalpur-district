import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Star, StarHalf, Phone, Mail } from "lucide-react"
import Image from "next/image"
import { CategoryBadge } from "../common/CategoryBadge"

const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari";
const STATE_NAME = process.env.NEXT_PUBLIC_STATE_NAME || "Chhattisgarh";

export type ListingCardProps = {
  id: string
  name: string
  category: string
  address: string
  rating?: number
  reviewCount?: number
  photoUrl?: string
  thumbnail?: string
  images?: string[]
  googlePhotos?: string[]
  phone?: string
  email?: string
  planType?: "featured" | "sponsored" | "free"
}

export function ListingCard({
  id,
  name,
  category,
  address,
  rating,
  reviewCount,
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

  // Clean address - remove city, state, pincode, India
  const cleanAddress = address
    ?.replace(new RegExp(`,?\\s*${CITY_NAME},?\\s*`, 'gi'), '')
    ?.replace(new RegExp(`,?\\s*${STATE_NAME},?\\s*`, 'gi'), '')
    ?.replace(/,?\s*India,?\s*/gi, '')
    ?.replace(/,?\s*\d{6},?\s*/g, '') // Remove 6-digit pincodes
    ?.trim()
    ?.replace(/^,|,$/g, '') // Remove leading/trailing commas
    ?.trim() || address

  // Render star rating
  const renderStars = () => {
    if (!rating || rating === 0) return null

    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarHalf key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)
      } else {
        stars.push(<Star key={i} className="h-3 w-3 text-gray-300" />)
      }
    }

    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">{stars}</div>
        <span className="text-xs font-medium text-gray-700">{rating.toFixed(1)}</span>
        {reviewCount && reviewCount > 0 && (
          <span className="text-xs text-gray-500">({reviewCount})</span>
        )}
      </div>
    )
  }

  return (
    <Card className="group bg-white border-0 shadow-md rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-red-500/10 cursor-pointer">
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

          {/* Plan badges - Lucide icons without circles - only for paid plans */}
          {planType === "featured" && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded px-1.5 py-1 shadow-md">
              <Star className="h-4 w-4 fill-red-500 text-red-500" />
            </div>
          )}
          {planType === "sponsored" && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded px-1.5 py-1 shadow-md">
              <StarHalf className="h-4 w-4 fill-red-500 text-red-500" />
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-40 w-full bg-gray-100 flex items-center justify-center">
          <Building2 className="h-12 w-12 text-gray-300" aria-hidden="true" />
          {planType === "featured" && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded px-1.5 py-1 shadow-md">
              <Star className="h-4 w-4 fill-red-500 text-red-500" />
            </div>
          )}
          {planType === "sponsored" && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded px-1.5 py-1 shadow-md">
              <StarHalf className="h-4 w-4 fill-red-500 text-red-500" />
            </div>
          )}
        </div>
      )}

      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold line-clamp-1 transition-colors duration-200 group-hover:text-red-500">{name}</CardTitle>
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

        {/* Star Rating */}
        {renderStars()}

        {/* Address - smaller font */}
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
