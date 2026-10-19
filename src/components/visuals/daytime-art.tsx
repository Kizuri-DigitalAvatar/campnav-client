"use client"

import { useId, useSyncExternalStore, type CSSProperties } from "react"

type Phase = "morning" | "afternoon" | "night"

function currentPhase(): Phase {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "morning"
  if (hour >= 12 && hour < 18) return "afternoon"
  return "night"
}

// Re-check once a minute so a long-open dashboard moves from sun to moon
function subscribeClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000)
  return () => window.clearInterval(timer)
}

const anim = (animation: string, delay = 0): CSSProperties =>
  ({ ["--a" as string]: animation, ["--ad" as string]: `${delay}s` })

/**
 * Small sky scene beside the greeting — rising sun, midday sun or moon and
 * stars — so the time of day is understood without reading the greeting.
 */
export function DaytimeArt({ size = 52, className = "" }: { size?: number; className?: string }) {
  // null on the server so its render and the first client render agree
  const phase = useSyncExternalStore(subscribeClock, currentPhase, () => null)
  const clip = `${useId().replace(/:/g, "")}-sky`

  const tone = phase === "night" ? "va-tone-indigo" : phase === "morning" ? "va-tone-orange" : "va-tone-amber"
  const rays = Array.from({ length: 8 }, (_, i) => i * 45)

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`va ${tone} ${className}`}
      data-motion="always"
      aria-hidden
      focusable="false"
    >
      <clipPath id={clip}>
        <rect x={1} y={1} width={62} height={62} rx={20} />
      </clipPath>
      <rect x={1} y={1} width={62} height={62} rx={20} className="f-s" />
      <g clipPath={`url(#${clip})`}>
      {phase === "night" ? (
        <>
          {[[16, 18, 2.2, 0], [48, 14, 1.6, 0.8], [50, 40, 2, 1.6], [14, 44, 1.4, 1.1]].map(([x, y, r, d]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className="va-anim f-gold" style={anim("va-twinkle-loop 2.4s ease-in-out infinite", d)} />
          ))}
          <g className="va-anim" style={anim("va-float 5s ease-in-out infinite")}>
            <path d="M38 16a17 17 0 1 0 12 26 14 14 0 0 1-12-26z" className="f-gold" />
            <circle cx={30} cy={36} r={2.4} className="f-d" opacity={0.12} />
            <circle cx={36} cy={44} r={1.6} className="f-d" opacity={0.12} />
          </g>
        </>
      ) : phase ? (
        <>
          <g transform={phase === "morning" ? "translate(0 8)" : undefined}>
            <g className="va-anim" style={anim("va-rays 14s linear infinite")}>
              {rays.map((deg) => (
                <rect
                  key={deg}
                  x={30.5}
                  y={8}
                  width={3}
                  height={7}
                  rx={1.5}
                  className="f-gold"
                  transform={`rotate(${deg} 32 32)`}
                />
              ))}
            </g>
            <circle cx={32} cy={32} r={11} className="f-gold" />
            <path d="M25 29a8 8 0 0 1 5-5" className="st s-h" strokeWidth={2} opacity={0.6} />
          </g>
          {phase === "morning" ? (
            <path d="M1 46c10-6 20-6 31-1s21 5 31 0V63H1z" className="f-m" opacity={0.85} />
          ) : (
            <path d="M34 50h18a5 5 0 0 0 0-10 7 7 0 0 0-13-2 5 5 0 0 0-5 12z" className="va-anim f-h" style={anim("va-drift-loop 9s linear infinite")} />
          )}
        </>
      ) : null}
      </g>
    </svg>
  )
}
