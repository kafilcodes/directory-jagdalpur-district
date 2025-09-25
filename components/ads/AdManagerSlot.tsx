"use client"
import React from "react"

declare global {
  interface Window {
    googletag?: any
    gptInitialized?: boolean
    gptSlots?: Map<string, any>
  }
}

function loadGPT() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null)
    if (window.googletag?.apiReady) return resolve(window.googletag)
    window.googletag = window.googletag || { cmd: [] }
    window.gptSlots = window.gptSlots || new Map()
    
    // Check if script is already loading or loaded
    const existingScript = document.querySelector('script[src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"]')
    if (existingScript) {
      // Wait for it to load if not ready yet
      if (window.googletag?.apiReady) {
        return resolve(window.googletag)
      }
      // Add listener for when it's ready
      existingScript.addEventListener('load', () => resolve(window.googletag))
      return
    }
    
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
        // Initialize GPT only once
        if (!window.gptInitialized) {
          googletag.pubads().enableSingleRequest()
          googletag.enableServices()
          window.gptInitialized = true
        }
        
        // Check if this slot already exists
        const existingSlot = window.gptSlots?.get(divId)
        if (existingSlot) {
          // Destroy the existing slot first
          googletag.destroySlots([existingSlot])
          window.gptSlots?.delete(divId)
        }
        
        // Create the new slot
        try {
          const newSlot = googletag.defineSlot(adUnitPath, sizes, divId)
          if (newSlot) {
            slotRef = newSlot.addService(googletag.pubads())
            window.gptSlots?.set(divId, slotRef)
            googletag.display(divId)
          }
        } catch (error) {
          console.warn(`Failed to create ad slot ${divId}:`, error)
        }
      })
    })

    return () => {
      destroyed = true
      try {
        const g = window.googletag
        if (g?.destroySlots && slotRef) {
          g.cmd.push(() => {
            g.destroySlots([slotRef])
            window.gptSlots?.delete(divId)
          })
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
