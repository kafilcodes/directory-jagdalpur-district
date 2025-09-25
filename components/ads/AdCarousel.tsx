"use client"
import React from "react"
import Carousel from "@/components/common/Carousel"
import ClientAdSlot from "@/components/ads/ClientAdSlot"

export default function AdCarousel() {
  // Render a few ad slots in a carousel; if ads fail, they simply occupy space
  const items = [
    <ClientAdSlot key="a" placementId="homepage-top-banner" />, // reuse config
    <ClientAdSlot key="b" placementId="search-inline-1" />,
    <ClientAdSlot key="c" placementId="search-inline-1" />,
  ]
  return (
    <Carousel>
      {items.map((item, idx) => (
        <div key={idx} className="rounded-lg border bg-white min-h-[160px] flex items-center justify-center">
          {item}
        </div>
      ))}
    </Carousel>
  )
}