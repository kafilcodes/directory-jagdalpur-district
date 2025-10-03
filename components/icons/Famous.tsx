"use client"
import SVGImage from "@/components/common/SVGImage"

export function Famous({ className, width = 640, height = 480, alt = "Fame & Social Influence" }: { className?: string; width?: number; height?: number; alt?: string }) {
  return <SVGImage src="/famous.svg" alt={alt} width={width} height={height} className={className} />
}

export default Famous
