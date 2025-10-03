"use client"
import SVGImage from "@/components/common/SVGImage"

export function Misc({ className, width = 640, height = 480, alt = "Local Discovery" }: { className?: string; width?: number; height?: number; alt?: string }) {
  return <SVGImage src="/misc.svg" alt={alt} width={width} height={height} className={className} />
}

export default Misc
