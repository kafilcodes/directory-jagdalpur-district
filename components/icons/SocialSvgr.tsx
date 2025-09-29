"use client"
import * as React from "react"
import FacebookSvg from "@/assets/icons/facebook.svg"
import XSvg from "@/assets/icons/x.svg"
import InstagramSvg from "@/assets/icons/instagram.svg"
import { FacebookIcon as FacebookFallback, XIcon as XFallback, InstagramIcon as InstagramFallback } from "@/components/icons/Social"
import { ErrorBoundary } from "@/components/icons/ErrorBoundary"

type Props = React.SVGProps<SVGSVGElement> & { size?: number }

export function Facebook({ size = 18, ...props }: Props) {
  return (
    <ErrorBoundary fallback={<FacebookFallback size={size} {...props} /> }>
      {/* @svgr components accept width/height props */}
      <FacebookSvg width={size} height={size} aria-hidden {...props} />
    </ErrorBoundary>
  )
}

export function X({ size = 18, ...props }: Props) {
  return (
    <ErrorBoundary fallback={<XFallback size={size} {...props} /> }>
      <XSvg width={size} height={size} aria-hidden {...props} />
    </ErrorBoundary>
  )
}

export function Instagram({ size = 18, ...props }: Props) {
  return (
    <ErrorBoundary fallback={<InstagramFallback size={size} {...props} /> }>
      <InstagramSvg width={size} height={size} aria-hidden {...props} />
    </ErrorBoundary>
  )
}

