import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type ListingCardProps = {
  id: string
  name: string
  category: string
  address: string
  rating?: number
}

export function ListingCard({ id, name, category, address, rating }: ListingCardProps) {
  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{name}</span>
          <Badge variant="secondary" className="capitalize">{category}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600 space-y-1">
        <p>{address}</p>
        {typeof rating === "number" && (
          <p className="text-gray-500">Rating: {rating.toFixed(1)}</p>
        )}
      </CardContent>
    </Card>
  )
}
