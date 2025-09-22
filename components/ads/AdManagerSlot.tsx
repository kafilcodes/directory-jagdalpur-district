"use client"
import React from "react"

declare global {
  interface Window {
    googletag?: any
  }
}

function loadGPT() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null)
    if (window.googletag?.apiReady) return resolve(window.googletag)
    window.googletag = window.googletag || { cmd: [] }
    const gads = document.createElement("script")
    gads.async = true
    gads.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js"
    gads.onload = () => resolve(window.googletag)
    document.head.appendChild(gads)
  })
}

type Props = {
  adUnitPath: string
  sizes: number[][]
  divId: string
  minHeight?: number
  className?: string
}

export function AdManagerSlot({ adUnitPath, sizes, divId, minHeight = 250, className }: Props) {
  React.useEffect(() => {
    let destroyed = false
    let slotRef: any = null

    loadGPT().then((googletag: any) => {
      if (!googletag || destroyed) return
      googletag.cmd.push(function () {
        googletag.pubads().enableSingleRequest()
        googletag.enableServices()
        slotRef = googletag.defineSlot(adUnitPath, sizes, divId).addService(googletag.pubads())
        googletag.display(divId)
      })
    })

    return () => {
      destroyed = true
      try {
        const g = window.googletag
        if (g?.pubads && slotRef) {
          g.destroySlots([slotRef])
        }
      } catch {}
    }
  }, [adUnitPath, sizes, divId])

  return React.createElement("div", {
    id: divId,
    className,
    style: { minHeight },
  })
}
