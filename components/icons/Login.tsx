/* eslint-disable @next/next/no-img-element */
"use client"
import * as React from "react"

// Reduced by 40% from displayed size: 79 * 0.6 = 47.4 ≈ 47, 50 * 0.6 = 30
export function Login({ className, width = 47, height = 30, alt = "Sign in" }: { className?: string; width?: number; height?: number; alt?: string }) {
  return <img src="/login.svg" alt={alt} width={width} height={height} className={className || "h-auto w-auto max-w-full"} />
}
export default Login

