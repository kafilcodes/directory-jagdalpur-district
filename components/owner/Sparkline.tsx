"use client"
import * as React from "react"

export function Sparkline({ data, width = 160, height = 40, stroke = "#ef4444" }: { data: number[]; width?: number; height?: number; stroke?: string }) {
  const max = Math.max(1, ...data)
  const min = Math.min(0, ...data)
  const range = Math.max(1, max - min)
  const step = width / Math.max(1, data.length - 1)
  const points = data.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(" ")

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Trend">
      <polyline fill="none" stroke={stroke} strokeWidth="2" points={points} />
    </svg>
  )
}

