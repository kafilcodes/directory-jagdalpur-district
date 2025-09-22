"use client"
import React from "react"

type Props = {
  slotId: string
  style?: React.CSSProperties
  className?: string
  minHeight?: number
}

export function AdSenseSlot({ slotId, style, className, minHeight = 250 }: Props) {
  React.useEffect(() => {
    if (typeof window === "undefined") return
    if (!(window as any).adsbygoogle) {
      const s = document.createElement("script")
      s.async = true
      s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
      s.setAttribute("data-ad-client", process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID || "")
      document.head.appendChild(s)
    } else {
      try {
        ;(window as any).adsbygoogle.push({})
      } catch {}
    }
  }, [])

  return React.createElement("ins", {
    className: ["adsbygoogle", className].filter(Boolean).join(" "),
    style: { display: "block", minHeight, ...style },
    ["data-ad-client"]: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID,
    ["data-ad-slot"]: slotId,
    ["data-full-width-responsive"]: "true",
  } as any)
}
