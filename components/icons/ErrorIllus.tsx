/* eslint-disable @next/next/no-img-element */
"use client"
import * as React from "react"

export function ErrorIllus({ className, width = 220, height = 140, alt = "Error" }: { className?: string; width?: number; height?: number; alt?: string }) {
  return <img src="/404.svg" alt={alt} width={width} height={height} className={className || "h-auto w-auto"} />
}
export default ErrorIllus

