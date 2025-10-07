import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function ListingCardSkeleton() {
    return (
        <Card className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Image Skeleton with Shimmer */}
            <div className="relative h-40 w-full bg-gray-200 animate-pulse overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>

            <CardHeader className="p-4 pb-2">
                {/* Title Skeleton */}
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                </div>
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-0 space-y-2">
                {/* Category Badge Skeleton */}
                <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                </div>

                {/* Metadata Skeleton */}
                <div className="flex items-center gap-2">
                    <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-3 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-3 w-3 bg-gray-200 rounded-full animate-pulse" />
                </div>

                {/* Address Skeleton */}
                <div className="space-y-1">
                    <div className="h-3 w-full bg-gray-200 rounded animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    </div>
                    <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    </div>
                </div>
            </CardContent>

            <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
        </Card>
    )
}
