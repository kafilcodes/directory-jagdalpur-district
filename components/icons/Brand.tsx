"use client"
import SVGImage from "@/components/common/SVGImage"

export function Brand({ className, width = 640, height = 480, alt = "Brand" }: { className?: string; width?: number; height?: number; alt?: string }) {
  return <SVGImage src="/brand.svg" alt={alt} width={width} height={height} className={className} />
}

export default Brand

