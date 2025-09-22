"use client"
import { AdSlot } from "@/components/ads/AdSlot"

export default function ClientAdSlot({ placementId }: { placementId: string }) {
  return <AdSlot placementId={placementId} />
}
