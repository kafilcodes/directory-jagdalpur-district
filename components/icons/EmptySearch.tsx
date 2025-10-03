/* eslint-disable @next/next/no-img-element */
"use client"
import * as React from "react"

export function EmptySearch({ className, width = 224, height = 160, alt = "No results" }: { className?: string; width?: number; height?: number; alt?: string }) {
  return <img src="/empty_search.svg" alt={alt} width={width} height={height} className={className || "w-auto h-auto"} />
}
export default EmptySearch

