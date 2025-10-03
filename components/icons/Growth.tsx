"use client"
import SVGImage from "@/components/common/SVGImage"

export function Growth({ className, width = 640, height = 480, alt = "Business Growth" }: { className?: string; width?: number; height?: number; alt?: string }) {
  return <SVGImage src="/growth.svg" alt={alt} width={width} height={height} className={className} />
}

export default Growth
