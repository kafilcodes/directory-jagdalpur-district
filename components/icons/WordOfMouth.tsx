"use client"
import SVGImage from "@/components/common/SVGImage"

export function WordOfMouth({ className, width = 640, height = 480, alt = "Word of Mouth" }: { className?: string; width?: number; height?: number; alt?: string }) {
  return <SVGImage src="/wordofmouth.svg" alt={alt} width={width} height={height} className={className} />
}

export default WordOfMouth
