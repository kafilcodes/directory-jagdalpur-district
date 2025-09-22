"use client"
import { useCallback, useMemo } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

export function useSearchParamsState() {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const get = useCallback((key: string) => sp.get(key) || "", [sp])
  const set = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(sp.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      router.replace(`${pathname}?${next.toString()}` as any, { scroll: false })
    },
    [sp, router, pathname]
  )

  return useMemo(() => ({ get, set }), [get, set])
}
