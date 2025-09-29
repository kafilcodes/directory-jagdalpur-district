"use client"

import * as React from "react"

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number }

export function FacebookIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
      {...props}
    >
      <circle cx="12" cy="12" r="11" fill="#1877F2" />
      <path
        d="M13.5 8.5h2V6h-2.5C11.6 6 10 7.6 10 9.5V11H8v2.5h2V19h2.5v-5.5H15L15.5 11H12v-1.5c0-.55.45-1 1-1h.5z"
        fill="#fff"
      />
      <title>Facebook</title>
    </svg>
  )
}

export function XIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
      {...props}
    >
      <rect x="1" y="1" width="22" height="22" rx="4" fill="#111" />
      <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <title>X (Twitter)</title>
    </svg>
  )
}

export function InstagramIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#E1306C" />
      <circle cx="12" cy="12" r="5" fill="#fff" />
      <circle cx="17" cy="7" r="1.2" fill="#fff" />
      <title>Instagram</title>
    </svg>
  )
}

