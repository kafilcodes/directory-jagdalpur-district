import React from "react"
import { adSlots } from "@/config/ads"
import { AdSenseSlot } from "@/components/ads/AdSenseSlot"
import { AdManagerSlot } from "@/components/ads/AdManagerSlot"

export function AdSlot({ placementId, className }: { placementId: string; className?: string }) {
  const cfg = adSlots[placementId]
  if (!cfg) return null

  if (cfg.type === "adsense") {
    return <AdSenseSlot slotId={cfg.slotId} minHeight={cfg.minHeight} className={className} />
  }

  return (
    <AdManagerSlot
      adUnitPath={cfg.adUnitPath}
      sizes={cfg.sizes}
      divId={cfg.divId}
      minHeight={cfg.minHeight}
      className={className}
    />
  )
}
