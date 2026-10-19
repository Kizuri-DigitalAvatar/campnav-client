"use client"

import { useEffect, useRef, type CSSProperties } from "react"
import { prefersReducedMotion } from "./hooks"

// Hue and mouth curve per rating: 0 = not chosen yet, 1 = poor … 5 = excellent
const HUE = [262, 18, 48, 75, 130, 158]
const CURVE = [0, -8, -4, 1.5, 6, 10]

/**
 * A face that frowns or smiles with the star rating, so choosing a score
 * makes sense even without reading "Poor" or "Excellent".
 */
export function MoodFace({ rating, size = 84, className = "" }: { rating: number; size?: number; className?: string }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)))
  const ref = useRef<SVGSVGElement>(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (prefersReducedMotion()) return
    ref.current?.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.14) rotate(-4deg)" }, { transform: "scale(1)" }],
      { duration: 380, easing: "cubic-bezier(.34,1.56,.64,1)" },
    )
  }, [r])

  const c = CURVE[r]
  const upper = 42 + c * 0.45
  const lower = 42 + c * 1.35 + (c >= 0 ? 2.5 : -2.5)
  const mouth = `M22 42Q32 ${upper} 42 42Q32 ${lower} 22 42Z`
  // Brows only show on the unhappy end
  const brow = r === 1 ? 4 : r === 2 ? 2 : 0

  return (
    <svg
      ref={ref}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`va va-mood ${className}`}
      data-motion="always"
      style={{ ["--va-h" as string]: HUE[r], ["--va-c" as string]: r === 0 ? 0.03 : 0.17 } as CSSProperties}
      aria-hidden
      focusable="false"
    >
      <circle cx={32} cy={32} r={28} className="f-m" />
      <path d="M14 22a20 20 0 0 1 14-12" className="st s-h" strokeWidth={3} opacity={0.35} />
      <g className="va-anim" style={{ ["--a" as string]: "va-blink 4.5s ease-in-out infinite" }}>
        <ellipse cx={23} cy={29} rx={3.2} ry={3.8} className="f-d" />
        <ellipse cx={41} cy={29} rx={3.2} ry={3.8} className="f-d" />
      </g>
      <path
        d={`M18 ${21 - brow / 2}L27 ${21 + brow / 2}M46 ${21 - brow / 2}L37 ${21 + brow / 2}`}
        className="st s-d"
        strokeWidth={2.5}
        style={{ opacity: brow ? 1 : 0, transition: "opacity 300ms ease" }}
      />
      <circle cx={16} cy={39} r={4} className="f-red" style={{ opacity: r >= 4 ? 0.35 : 0, transition: "opacity 300ms ease" }} />
      <circle cx={48} cy={39} r={4} className="f-red" style={{ opacity: r >= 4 ? 0.35 : 0, transition: "opacity 300ms ease" }} />
      <path d={mouth} className="f-d" />
    </svg>
  )
}
