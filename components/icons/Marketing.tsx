"use client"
import SVGImage from "@/components/common/SVGImage"

export function Marketing({ className, width = 640, height = 480, alt = "Smarter Marketing" }: { className?: string; width?: number; height?: number; alt?: string }) {
  return <SVGImage src="/marketing.svg" alt={alt} width={width} height={height} className={className} />
}

export default Marketing
