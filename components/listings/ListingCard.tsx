import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Star } from "lucide-react"

export type ListingCardProps = {
  id: string
  name: string
  category: string
  address: string
  rating?: number
  photoUrl?: string
}

export function ListingCard({ id, name, category, address, rating }: ListingCardProps) {
  return (
    <Card className="group bg-white border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-300">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-md bg-red-50 text-red-600 flex items-center justify-center">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1">{name}</CardTitle>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="capitalize shrink-0 bg-gray-100 text-gray-700 hover:bg-gray-200">
                {category}
              </Badge>
              {typeof rating === "number" && (
                <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                  <Star className="h-4 w-4 text-yellow-500" aria-hidden="true" />
                  {rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 mt-0.5 text-gray-400" aria-hidden="true" />
          <p className="line-clamp-2">{address}</p>
        </div>
      </CardContent>
    </Card>
  )
}
