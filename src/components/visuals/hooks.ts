"use client"

import { useEffect, useState, useSyncExternalStore } from "react"

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"

export function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.(REDUCED_QUERY).matches
}

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia?.(REDUCED_QUERY)
  mq?.addEventListener("change", onChange)
  return () => mq?.removeEventListener("change", onChange)
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribeReduced, prefersReducedMotion, () => false)
}

/**
 * Hands a "spotlight" round a grid of tiles, one at a time, so each
 * illustration acts out its service in turn without the whole grid moving
 * at once. Put `va-live` on the tile whose index is returned.
 * Returns -1 (nothing live) for reduced-motion users.
 */
export function useSpotlight(count: number, intervalMs = 2600) {
  const [index, setIndex] = useState(-1)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || count < 1) return
    let i = -1
    const tick = () => {
      if (document.hidden) return
      i = (i + 1) % count
      setIndex(i)
    }
    const start = window.setTimeout(tick, 700)
    const timer = window.setInterval(tick, intervalMs)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(timer)
    }
  }, [count, intervalMs, reduced])

  return reduced ? -1 : index
}
