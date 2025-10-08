"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Navigation,
  Clock,
  X,
  Share2,
  Bookmark,
  CheckCircle,
  Wifi,
  Car,
  Coffee,
  CreditCard,
  Users,
  Shield
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { CategoryBadge } from "@/components/common/CategoryBadge"

const amenityIcons: Record<string, React.ReactNode> = {
  "Wifi": <Wifi className="h-4 w-4" />,
  "Parking": <Car className="h-4 w-4" />,
  "Restaurant": <Coffee className="h-4 w-4" />,
  "Card Payment": <CreditCard className="h-4 w-4" />,
  "Family Friendly": <Users className="h-4 w-4" />,
  "Verified": <Shield className="h-4 w-4" />,
}

// Gallery Image Component with Skeleton Loading
function GalleryImageWithSkeleton({ src, alt }: { src: string; alt: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
      {loading && !error && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className={cn(
          "object-cover transition-opacity duration-300",
          loading ? "opacity-0" : "opacity-100"
        )}
        unoptimized={src.includes('/api/')}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false)
          setError(true)
        }}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-400 text-sm">Failed to load</span>
        </div>
      )}
    </div>
  )
}

export default function ListingDetailSheet() {
  const sp = useSearchParams()
  const router = useRouter()
  const id = useMemo(() => sp.get("id") || "", [sp])
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const active = !!id
    setOpen(active)
    if (!active) {
      setData(null)
      setLoading(false)
      return
    }
    // Set loading immediately when opening
    setLoading(true)
    setData(null) // Clear previous data
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((j) => setData(j?.data || null))
      .catch((err) => {
        console.error("Failed to fetch listing:", err)
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      const url = new URL(window.location.href)
      url.searchParams.delete("id")
      // Use replace to avoid adding to history and prevent page refresh
      const newUrl = url.pathname + url.search
      router.replace(newUrl as any, { scroll: false })
      setData(null)
    }
    setOpen(isOpen)
  }

  if (!open) return null

  // Prepare data from real Firestore fields
  const listing = data || {}
  const displayName = listing.name || listing.businessName || listing.title || "Business"

  // Determine plan type for gallery limits and badge - use "plan" field from Firestore
  const planType = listing.plan || "free"
  const galleryLimit = planType === "featured" ? 20 : planType === "sponsored" ? 10 : 5

  // Extract images from "photos" array (primary field in Firestore)
  const photosArray = (listing.photos || []).filter(Boolean)

  // Get ALL available images first, then apply plan-based limit for display
  const allImages = photosArray.slice(0, Math.min(photosArray.length, galleryLimit))

  // Extract hero image - use first photo from photos array (primary image)
  const heroImage = (photosArray.length > 0 ? photosArray[0] : null) ||
    listing.thumbnail ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600"

  // Extract address
  const addressObj = listing.address || {}
  const displayAddress = addressObj.formattedAddress ||
    listing.formattedAddress ||
    addressObj.line1 ||
    (typeof addressObj === 'string' ? addressObj : "")

  // Extract reviews (Google Places API format)
  const reviews = listing.reviews || listing.googleReviews || []

  // Extract opening hours
  const openingHours = listing.openingHours ||
    listing.currentOpeningHours?.weekdayDescriptions ||
    listing.regularOpeningHours?.weekdayDescriptions ||
    []

  const isOpenNow = listing.currentOpeningHours?.openNow ||
    listing.regularOpeningHours?.openNow ||
    false

  // Tabs logic - show Contact, conditionally show Gallery/About/Hours (NO reviews tab)
  const hasDescription = listing.description || listing.editorialSummary
  const hasGallery = allImages.length > 1
  const hasHours = openingHours.length > 0
  const hasReviews = reviews.length > 0

  // Build tabs array dynamically - always start with contact, conditionally add others
  const tabs = ["contact"] // Always show contact
  if (hasGallery) tabs.push("gallery")
  if (hasDescription) tabs.push("about")
  if (hasHours) tabs.push("hours")
  // Only show reviews tab if reviews exist in DB (from Google Places data)
  if (hasReviews) tabs.push("reviews")

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-2xl p-0 overflow-hidden no-default-close bg-white">
        {/* Accessible title - visually hidden */}
        <SheetTitle className="sr-only">{displayName}</SheetTitle>

        <ScrollArea className="h-full">
          {(loading || !data) ? (
            <div className="space-y-0 animate-pulse">
              {/* Hero Image Skeleton */}
              <Skeleton className="h-64 sm:h-80 w-full rounded-none bg-gray-200" />

              {/* Content Skeleton */}
              <div className="p-6 space-y-6">
                {/* Title & Badge */}
                <div className="space-y-3">
                  <Skeleton className="h-8 w-3/4 bg-gray-200" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 bg-gray-200" />
                    <Skeleton className="h-6 w-16 bg-gray-200" />
                  </div>
                </div>

                {/* Quick Actions Skeleton */}
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-10 w-full bg-gray-200" />
                  <Skeleton className="h-10 w-full bg-gray-200" />
                </div>

                {/* Tabs Skeleton */}
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24 bg-gray-200" />
                  <Skeleton className="h-10 w-24 bg-gray-200" />
                  <Skeleton className="h-10 w-24 bg-gray-200" />
                </div>

                {/* Contact Buttons Skeleton */}
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-10 w-full bg-gray-200" />
                  <Skeleton className="h-10 w-full bg-gray-200" />
                  <Skeleton className="h-10 w-full bg-gray-200" />
                  <Skeleton className="h-10 w-full bg-gray-200" />
                </div>

                {/* Details Skeleton */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-gray-200" />
                  <Skeleton className="h-4 w-5/6 bg-gray-200" />
                  <Skeleton className="h-4 w-4/5 bg-gray-200" />
                  <Skeleton className="h-4 w-full bg-gray-200" />
                  <Skeleton className="h-4 w-3/4 bg-gray-200" />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Hero Image */}
              <div className="relative h-64 sm:h-80">
                <Image
                  src={heroImage}
                  alt={displayName}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  unoptimized={heroImage.includes('/api/')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Plan Badge on Primary Image - only for paid plans */}
                {planType === 'featured' && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-yellow-500 text-white px-3 py-1.5 rounded-full shadow-lg">
                    <Star className="h-4 w-4 fill-white" />
                    <span className="text-sm font-semibold">Featured</span>
                  </div>
                )}
                {planType === 'sponsored' && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full shadow-lg">
                    <Star className="h-4 w-4" />
                    <span className="text-sm font-semibold">Sponsored</span>
                  </div>
                )}

                {/* Action Buttons - Close only (bookmark/share removed per product requirements) */}
                <div className="absolute top-4 right-4">
                  <Button size="icon" variant="secondary" className="bg-white/90 backdrop-blur" onClick={() => handleClose(false)} aria-label="Close details">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold mb-2">{displayName}</h2>
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        {(listing.category || listing.categorySlug) && (
                          <CategoryBadge
                            category={listing.category || listing.categorySlug}
                            variant="secondary"
                            showText={true}
                            showIcon={true}
                            iconSize="h-3.5 w-3.5"
                            className="bg-white/20 backdrop-blur text-white border-white/30"
                          />
                        )}
                        {(listing.activePlan?.type === 'featured' || listing.monetization?.type === 'featured') && (
                          <Badge className="bg-yellow-500">Featured</Badge>
                        )}
                        {(listing.activePlan?.type === 'sponsored' || listing.monetization?.type === 'sponsored') && (
                          <Badge className="bg-blue-500">Sponsored</Badge>
                        )}
                        {typeof listing.rating === 'number' && listing.rating > 0 && (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="ml-1 font-medium">{listing.rating.toFixed(1)}</span>
                            {listing.userRatingCount && (
                              <span className="ml-1 opacity-90">({listing.userRatingCount})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Quick Actions - Call and Directions buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {listing.phone && (
                    <Button asChild className="gap-2 w-full" variant="outline">
                      <a href={`tel:${listing.phone}`}>
                        <Phone className="h-4 w-4" />
                        Call Now
                      </a>
                    </Button>
                  )}
                  {(displayName || displayAddress) && (
                    <Button asChild className="gap-2 w-full" variant="outline">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayName + ' Dhamtari')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="h-4 w-4" />
                        Get Directions
                      </a>
                    </Button>
                  )}
                </div>

                {/* Tabs */}
                <Tabs defaultValue={tabs[0]} className="w-full">
                  <TabsList className={cn("grid w-full bg", `grid-cols-${Math.min(tabs.length, 5)}`)}>
                    {tabs.includes("contact") && <TabsTrigger value="contact">Contact</TabsTrigger>}
                    {tabs.includes("gallery") && <TabsTrigger value="gallery">Gallery</TabsTrigger>}
                    {tabs.includes("reviews") && <TabsTrigger value="reviews">Reviews</TabsTrigger>}
                    {tabs.includes("about") && <TabsTrigger value="about">About</TabsTrigger>}
                    {tabs.includes("hours") && <TabsTrigger value="hours">Hours</TabsTrigger>}
                  </TabsList>

                  {/* Contact Tab */}
                  <TabsContent value="contact" className="mt-6 space-y-6">
                    {/* Contact Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Contact Information</h3>



                      {/* Contact Details */}
                      <div className="space-y-3 pt-4">
                        {displayAddress && (
                          <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium">Address</p>
                              <p className="text-sm text-gray-600">{displayAddress}</p>
                            </div>
                          </div>
                        )}

                        {listing.phone && (
                          <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-red-400 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium">Phone</p>
                              <p className="text-sm text-gray-600">{listing.phone}</p>
                            </div>
                            <a
                              href={`tel:${listing.phone}`}
                              className="h-9 w-9 rounded-full border border-gray-300 hover:border-green-500 hover: text-gray-600 hover:text-green-600 flex items-center justify-center transition-all hover:scale-110 shrink-0"
                              aria-label="Call"
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                          </div>
                        )}

                        {listing.email && (
                          <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-red-400 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium">Email</p>
                              <p className="text-sm text-gray-600">{listing.email}</p>
                            </div>
                            <a
                              href={`mailto:${listing.email}`}
                              className="h-9 w-9 rounded-full border border-gray-300 hover:border-blue-500  text-gray-600 hover:text-blue-600 flex items-center justify-center transition-all hover:scale-110 shrink-0"
                              aria-label="Send Email"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                          </div>
                        )}

                        {(listing.website || listing.websiteUri) && (
                          <div className="flex items-start gap-3">
                            <Globe className="h-5 w-5 text-red-400 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium">Website</p>
                              <p className="text-sm text-gray-600 break-all">{listing.website || listing.websiteUri}</p>
                            </div>
                            <a
                              href={listing.website || listing.websiteUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 w-9 rounded-full border border-gray-300 hover:border-purple-500  text-gray-600 hover:text-purple-600 flex items-center justify-center transition-all hover:scale-110 shrink-0"
                              aria-label="Visit Website"
                            >
                              <Globe className="h-4 w-4" />
                            </a>
                          </div>
                        )}

                        {hasHours && (
                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="font-medium">Business Hours</p>
                              {isOpenNow && (
                                <Badge variant="outline" className="mt-1 text-green-600 border-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Open Now
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>


                  </TabsContent>

                  {/* About Tab - Description and business details */}
                  {hasDescription && (
                    <TabsContent value="about" className="mt-6 space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">About {displayName}</h3>
                        <p className="text-gray-600 leading-relaxed">{listing.description || listing.editorialSummary}</p>
                      </div>
                      {/* Amenities/Tags */}
                      {listing.tags && listing.tags.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">Amenities & Features</h3>
                          <div className="flex flex-wrap gap-2">
                            {listing.tags.map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="gap-1 py-1.5">
                                {amenityIcons[tag] || <CheckCircle className="h-4 w-4 text-red-400" />}
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  )}

                  {/* Gallery Tab - Plan-based limits: free=5, sponsored=10, featured=20 */}
                  {hasGallery && (
                    <TabsContent value="gallery" className="mt-4 ">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600">
                          {allImages.length} {allImages.length === 1 ? 'image' : 'images'}
                          {allImages.length >= galleryLimit && (
                            <span className="ml-1 text-gray-500">
                              (max {galleryLimit} for {planType} plan)
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-0">
                        {allImages.map((image: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => window.open(image, '_blank')}
                            className="relative m-2   rounded-lg overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <GalleryImageWithSkeleton
                              src={image}
                              alt={`${displayName} - Image ${index + 1}`}
                            />
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                  )}

                  {/* Reviews Tab - Always show with empty state */}
                  <TabsContent value="reviews" className="mt-6 space-y-4">
                    {reviews.length > 0 ? (
                      <>
                        {/* Review Summary */}
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-3xl font-bold">{listing.rating || 4.5}</span>
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={cn(
                                          "h-5 w-5",
                                          star <= Math.floor(listing.rating || 4.5)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                        )}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Based on {listing.userRatingCount || reviews.length} reviews</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Reviews List */}
                        <div className="space-y-4">
                          {reviews.map((review: any, idx: number) => (
                            <Card key={idx}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <Avatar>
                                    <AvatarImage src={review.authorPhoto || review.authorAttribution?.photoUri} />
                                    <AvatarFallback>{(review.authorName || review.authorAttribution?.displayName || "A")[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <div>
                                        <p className="font-medium">{review.authorName || review.authorAttribution?.displayName || "Anonymous"}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <div className="flex">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <Star
                                                key={star}
                                                className={cn(
                                                  "h-3 w-3",
                                                  star <= (review.rating || 0)
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300"
                                                )}
                                              />
                                            ))}
                                          </div>
                                          <span className="text-xs text-gray-500">{review.relativeTime || review.relativePublishTimeDescription}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">{review.text || review.originalText?.text || ""}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="p-12 text-center">
                        <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No reviews available</p>
                        <p className="text-gray-400 text-sm mt-2">This listing has no reviews yet</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Hours Tab */}
                  {hasHours && (
                    <TabsContent value="hours" className="mt-6">
                      <div className="space-y-2">
                        {openingHours.map((line: string, idx: number) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-sm">{line}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
