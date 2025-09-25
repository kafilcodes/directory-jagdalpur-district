"use client"
import React, { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function Carousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const scroll = (dir: "left" | "right") => {
    const el = ref.current
    if (!el) return
    const amount = el.clientWidth * 0.9
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" })
  }
  return (
    <div className="relative">
      <button
        aria-label="Scroll left"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white border shadow-sm hover:bg-gray-50 hidden sm:inline-flex"
        onClick={() => scroll("left")}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory px-1"
        style={{ scrollPadding: 8 }}
      >
        {React.Children.map(children, (child, idx) => (
          <div className="snap-start shrink-0 w-72">{child}</div>
        ))}
      </div>
      <button
        aria-label="Scroll right"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white border shadow-sm hover:bg-gray-50 hidden sm:inline-flex"
        onClick={() => scroll("right")}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}