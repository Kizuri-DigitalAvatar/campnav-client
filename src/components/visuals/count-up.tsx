"use client"

import { useEffect, useRef, useState } from "react"
import { prefersReducedMotion } from "./hooks"

/**
 * A number that rolls up to its value (and rolls between values when live
 * data changes), so a change on the dashboard is noticed rather than missed.
 */
export function CountUp({
  value,
  duration = 800,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  // The in-flight number while rolling; null once it has landed on `value`
  const [rolling, setRolling] = useState<number | null>(0)
  const current = useRef(0)

  useEffect(() => {
    const start = current.current
    let frame = 0
    if (prefersReducedMotion() || start === value) {
      current.current = value
      frame = requestAnimationFrame(() => setRolling(null))
      return () => cancelAnimationFrame(frame)
    }
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const v = start + (value - start) * (1 - Math.pow(1 - p, 3))
      current.current = v
      setRolling(p < 1 ? v : null)
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  const shown = rolling ?? value
  return (
    <span className={className} aria-label={`${prefix}${value.toFixed(decimals)}${suffix}`}>
      <span aria-hidden>
        {prefix}
        {shown.toFixed(decimals)}
        {suffix}
      </span>
    </span>
  )
}
