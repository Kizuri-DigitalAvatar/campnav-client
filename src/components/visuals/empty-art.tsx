"use client"

import { ServiceArt, type ArtKind, type ArtTone } from "./service-art"

/**
 * A larger, gently floating illustration for empty states — "nothing here
 * yet" reads at a glance, and the drawing hints at what belongs here.
 */
export function EmptyArt({
  kind,
  size = 88,
  tone,
  className = "",
}: {
  kind: ArtKind
  size?: number
  tone?: ArtTone
  className?: string
}) {
  return (
    <div className={`relative inline-flex flex-col items-center ${className}`} aria-hidden>
      <div className="va-floaty">
        <ServiceArt kind={kind} tone={tone} size={size} motion="always" />
      </div>
      <div
        className="va-floaty-shadow -mt-1 rounded-[50%] bg-foreground/10 blur-[2px]"
        style={{ width: size * 0.6, height: Math.max(5, size * 0.07) }}
      />
    </div>
  )
}
