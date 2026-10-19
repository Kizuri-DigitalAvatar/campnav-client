"use client"

import { useId, type CSSProperties, type ReactNode } from "react"

/*
 * Animated, picture-first illustrations for CampNav services.
 *
 * Each drawing acts out what the service does (a lid lifts off hot food, a
 * broom sweeps, a wrench turns, a drum spins) so a resident can recognise a
 * tile without reading its label. Pure SVG + CSS — see visuals.css for the
 * colour tokens and the motion modes.
 */

export type ArtKind =
  | "room_service"
  | "housekeeping"
  | "maintenance"
  | "laundry"
  | "shop"
  | "meals"
  | "rnr"
  | "hse"
  | "facility"
  | "requests"
  | "delivery"
  | "news"
  | "search"
  | "room"
  | "calendar"
  | "tasks"

export type ArtTone =
  | "blue" | "sky" | "teal" | "emerald" | "amber" | "orange" | "rose" | "violet" | "indigo" | "slate"

export type ArtMotion = "always" | "ambient" | "hover" | "none"

const DEFAULT_TONE: Record<ArtKind, ArtTone> = {
  room_service: "amber",
  housekeeping: "teal",
  maintenance: "blue",
  laundry: "sky",
  shop: "emerald",
  meals: "orange",
  rnr: "indigo",
  hse: "rose",
  facility: "violet",
  calendar: "violet",
  requests: "blue",
  tasks: "violet",
  delivery: "amber",
  news: "emerald",
  search: "slate",
  room: "indigo",
}

/** Map a request/order `type` string from the backend onto an illustration. */
export function artForType(type?: string): ArtKind {
  switch (type?.toLowerCase()) {
    case "maintenance": return "maintenance"
    case "housekeeping": return "housekeeping"
    case "laundry": return "laundry"
    case "room_service": return "room_service"
    case "delivery": return "delivery"
    case "shop": return "shop"
    case "meals": return "meals"
    default: return "requests"
  }
}

// One cycle of the "action then rest" keyframes
const CYCLE = "3.6s"

/** Inline style that hands keyframes (and an optional extra delay) to `.va-anim`. */
function a(animation: string, delay = 0, extra?: CSSProperties): CSSProperties {
  return { ["--a" as string]: animation, ["--ad" as string]: `${delay}s`, ...extra }
}

/** Rotate about a fixed point in the 64×64 drawing instead of the shape's centre. */
function pivot(x: number, y: number): CSSProperties {
  return { transformBox: "view-box", transformOrigin: `${x}px ${y}px` }
}

function gearPath(cx: number, cy: number, outer: number, inner: number, teeth: number) {
  const steps = teeth * 4
  const pts: string[] = []
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2 - Math.PI / 2
    const r = i % 4 < 2 ? outer : inner
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)} ${(cy + r * Math.sin(angle)).toFixed(2)}`)
  }
  return `M${pts.join("L")}Z`
}

// Curved four-point sparkle
function sparkle(cx: number, cy: number, r: number) {
  return `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`
}

function cloud(x: number, y: number, s = 1) {
  return `M${x} ${y}h${18 * s}a${4.5 * s} ${4.5 * s} 0 0 0 0-${9 * s}a${6.5 * s} ${6.5 * s} 0 0 0-${12 * s}-${2 * s}a${4.5 * s} ${4.5 * s} 0 0 0-${6 * s} ${11 * s}z`
}

const rise = (delay: number) => a(`va-rise ${CYCLE} ease-out infinite both`, delay)

// ── Drawings ──────────────────────────────────────────────────────────────

function RoomService() {
  return (
    <>
      <path d="M22 19c-2-2.5 2-4.5 0-7" className="va-anim st s-m" strokeWidth={2.5} style={rise(0.35)} />
      <path d="M42 19c-2-2.5 2-4.5 0-7" className="va-anim st s-m" strokeWidth={2.5} style={rise(0.6)} />
      <rect x={9} y={45} width={46} height={5} rx={2.5} className="f-d" />
      <g className="va-anim" style={a(`va-lift ${CYCLE} cubic-bezier(.34,1.4,.64,1) infinite`, 0, pivot(51, 45))}>
        <path d="M13 45a19 19 0 0 1 38 0z" className="f-m" />
        <path d="M19 41a13 13 0 0 1 8-10" className="st s-h" strokeWidth={3} opacity={0.7} />
        <rect x={29.5} y={22} width={5} height={5} rx={1.5} className="f-d" />
        <circle cx={32} cy={21} r={3} className="f-d" />
      </g>
    </>
  )
}

function Housekeeping() {
  return (
    <>
      <rect x={10} y={54} width={44} height={3} rx={1.5} className="f-s2" />
      <circle cx={15} cy={51} r={2} className="va-anim f-s2" style={rise(0.45)} />
      <circle cx={49} cy={50} r={1.6} className="va-anim f-s2" style={rise(0.75)} />
      <g className="va-anim" style={a(`va-sweep ${CYCLE} ease-in-out infinite`, 0, pivot(32, 9))}>
        <rect x={30} y={7} width={4} height={30} rx={2} className="f-d" />
        <rect x={23} y={35} width={18} height={6} rx={2} className="f-m" />
        <path d="M23 41h18l5 12H18z" className="f-gold" />
        <path d="M27 44l-2 7M32 44v7M37 44l2 7" className="st s-d" strokeWidth={1.4} opacity={0.3} />
      </g>
      <path d={sparkle(13, 18, 5)} className="va-anim f-gold" style={a(`va-twinkle ${CYCLE} ease-out infinite both`, 0.2)} />
      <path d={sparkle(51, 15, 4)} className="va-anim f-gold" style={a(`va-twinkle ${CYCLE} ease-out infinite both`, 0.5)} />
      <path d={sparkle(52, 36, 3)} className="va-anim f-m" style={a(`va-twinkle ${CYCLE} ease-out infinite both`, 0.8)} />
    </>
  )
}

function Maintenance() {
  return (
    <>
      <g className="va-anim" style={a(`va-gear ${CYCLE} ease-in-out infinite`)}>
        <path d={gearPath(47, 47, 10, 7.5, 8)} className="f-d" />
        <circle cx={47} cy={47} r={3} className="f-s" />
      </g>
      <g className="va-anim" style={a(`va-twist ${CYCLE} cubic-bezier(.45,0,.2,1) infinite`, 0, pivot(40, 22))}>
        <g transform="translate(40 22) rotate(43)">
          <path d="M-3.5 6h7v28a3.5 3.5 0 0 1-7 0z" className="f-m" />
          <path d="M-4 -9V-3H4V-9A10 10 0 1 1 -4 -9Z" className="f-m" />
          <path d="M-1 9v20" className="st s-h" strokeWidth={1.6} opacity={0.55} />
          <circle cx={0} cy={30} r={1.8} className="f-s" />
        </g>
      </g>
      <path d={sparkle(16, 15, 3.5)} className="va-anim f-gold" style={a(`va-twinkle ${CYCLE} ease-out infinite both`, 0.55)} />
    </>
  )
}

function Laundry({ uid }: { uid: string }) {
  const clip = `${uid}-drum`
  return (
    <>
      <circle cx={55} cy={24} r={2.4} className="va-anim st s-m" strokeWidth={1.5} style={a(`va-rise ${CYCLE} ease-out infinite both`, 0.3)} />
      <circle cx={57} cy={15} r={1.7} className="va-anim st s-m" strokeWidth={1.5} style={a(`va-rise ${CYCLE} ease-out infinite both`, 0.6)} />
      <circle cx={8} cy={30} r={2} className="va-anim st s-m" strokeWidth={1.5} style={a(`va-rise ${CYCLE} ease-out infinite both`, 0.9)} />
      <g className="va-anim" style={a(`va-shake ${CYCLE} linear infinite`)}>
        <rect x={13} y={8} width={38} height={48} rx={7} className="f-h s-m" strokeWidth={2.5} />
        <path d="M14 19h36" className="st s-m" strokeWidth={2} />
        <circle cx={20} cy={13.5} r={2} className="f-m" />
        <circle cx={26} cy={13.5} r={2} className="f-s2" />
        <rect x={36} y={11.5} width={10} height={4} rx={2} className="f-d" />
        <circle cx={32} cy={37} r={13} className="f-s2 s-m" strokeWidth={3} />
        <clipPath id={clip}>
          <circle cx={32} cy={37} r={10.5} />
        </clipPath>
        <g clipPath={`url(#${clip})`}>
          <path d="M20 40q3-2 6 0t6 0 6 0 6 0V50H20z" className="f-m" opacity={0.45} />
          <g className="va-anim" style={a(`va-spin-step ${CYCLE} cubic-bezier(.45,0,.3,1) infinite`, 0, pivot(32, 37))}>
            <path d="M24 31h7l1 3h-2v5h-5v-5h-2z" className="f-red" />
            <circle cx={37} cy={41} r={3.5} className="f-gold" />
            <rect x={33} y={29} width={6} height={4} rx={2} className="f-green" />
          </g>
        </g>
        <path d="M24.5 31.5a10 10 0 0 1 6-4" className="st s-h" strokeWidth={2.5} opacity={0.85} />
      </g>
    </>
  )
}

function Shop() {
  return (
    <>
      <g className="va-anim" style={a(`va-pop-up ${CYCLE} cubic-bezier(.34,1.56,.64,1) infinite`, 0.1)}>
        <rect x={21} y={11} width={7} height={19} rx={3.5} className="f-gold" />
        <path d="M22.5 16l4-2M22.5 21l4-2" className="st s-d" strokeWidth={1.2} opacity={0.3} />
        <circle cx={38} cy={20} r={6} className="f-red" />
        <path d="M38 14c1-3 4-3.4 5-2.2-1 2-3 3-5 2.2z" className="f-green" />
      </g>
      <g className="va-anim o-b" style={a(`va-bounce ${CYCLE} ease-in-out infinite`)}>
        <path d="M12 26h40l-3.5 27a4 4 0 0 1-4 3.5h-25a4 4 0 0 1-4-3.5z" className="f-m" />
        <path d="M17.5 31l2.3 19" className="st s-h" strokeWidth={2.5} opacity={0.5} />
        <path d="M24 31v-6a8 8 0 0 1 16 0v6" className="st s-d" strokeWidth={3} />
        <circle cx={24} cy={31} r={1.8} className="f-d" />
        <circle cx={40} cy={31} r={1.8} className="f-d" />
      </g>
    </>
  )
}

function Meals() {
  return (
    <>
      <path d="M21 17c-2-2.5 2-4.5 0-7" className="va-anim st s-m" strokeWidth={2.5} style={rise(0.25)} />
      <path d="M43 17c-2-2.5 2-4.5 0-7" className="va-anim st s-m" strokeWidth={2.5} style={rise(0.55)} />
      <rect x={7} y={34} width={8} height={4} rx={2} className="f-d" />
      <rect x={49} y={34} width={8} height={4} rx={2} className="f-d" />
      <path d="M13 32h38v13a10 10 0 0 1-10 10H23a10 10 0 0 1-10-10z" className="f-m" />
      <rect x={13} y={32} width={38} height={4} className="f-d" opacity={0.2} />
      <path d="M18 41v4a5 5 0 0 0 3 4.5" className="st s-h" strokeWidth={2.5} opacity={0.55} />
      <g className="va-anim o-b" style={a(`va-rattle ${CYCLE} ease-in-out infinite`)}>
        <path d="M11 32a21 8 0 0 1 42 0z" className="f-d" />
        <rect x={29} y={20} width={6} height={5} rx={2} className="f-d" />
        <path d="M18 29a15 5 0 0 1 9-3" className="st s-h" strokeWidth={1.8} opacity={0.35} />
      </g>
    </>
  )
}

const LUCIDE_PLANE =
  "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"

function Rnr() {
  return (
    <>
      <path d={cloud(36, 54, 1)} className="va-anim f-h" opacity={0.95} style={a(`va-drift ${CYCLE} linear infinite both`, 0.1)} />
      <path d={cloud(6, 22, 0.8)} className="va-anim f-h" opacity={0.9} style={a(`va-drift ${CYCLE} linear infinite both`, 0.5)} />
      <path d="M6 58c8-4 11-8 15-13" className="st s-m" strokeWidth={2} strokeDasharray="2 4" opacity={0.6} />
      <g className="va-anim" style={a(`va-fly ${CYCLE} ease-in-out infinite`)}>
        <g transform="translate(9 7) scale(2.1)">
          <path d={LUCIDE_PLANE} className="f-m s-d" strokeWidth={0.5} strokeLinejoin="round" />
        </g>
      </g>
    </>
  )
}

function Hse() {
  return (
    <>
      <circle cx={32} cy={32} r={21} className="va-anim st s-m" strokeWidth={2} opacity={0} style={a(`va-ping ${CYCLE} ease-out infinite both`)} />
      <g className="va-anim" style={a(`va-throb ${CYCLE} ease-in-out infinite`)}>
        <path d="M32 8l18 6v14c0 12-8 21-18 26-10-5-18-14-18-26V14z" className="f-m" />
        <path d="M32 8v46c-10-5-18-14-18-26V14z" className="f-h" opacity={0.18} />
        <rect x={29.5} y={19} width={5} height={17} rx={2.5} className="f-h" />
        <circle cx={32} cy={42.5} r={3} className="f-h" />
      </g>
    </>
  )
}

function Facility() {
  const cells = [
    [17, 31], [26, 31], [35, 31], [44, 31],
    [17, 41], [26, 41], [44, 41],
  ]
  return (
    <>
      <rect x={11} y={14} width={42} height={40} rx={7} className="f-h s-m" strokeWidth={2.5} />
      <path d="M11 21a7 7 0 0 1 7-7h28a7 7 0 0 1 7 7v4H11z" className="f-m" />
      <rect x={20} y={9} width={4} height={10} rx={2} className="f-d" />
      <rect x={40} y={9} width={4} height={10} rx={2} className="f-d" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={5} height={5} rx={1.5} className="f-s2" />
      ))}
      <g className="va-anim" style={a(`va-throb ${CYCLE} ease-in-out infinite`, 0.1)}>
        <rect x={33} y={39} width={9} height={9} rx={2.5} className="f-m" />
      </g>
      <path
        d="M35 43.5l2 2 3.2-3.6"
        pathLength={1}
        className="va-anim st s-h"
        strokeWidth={1.8}
        style={a(`va-draw ${CYCLE} ease-out infinite both`, 0.35, { strokeDasharray: 1 })}
      />
    </>
  )
}

function Requests() {
  const rows = [24, 33, 42]
  return (
    <>
      <rect x={14} y={10} width={36} height={46} rx={6} className="f-m" />
      <rect x={18} y={16} width={28} height={36} rx={3} className="f-h" />
      <rect x={24} y={6} width={16} height={8} rx={3} className="f-d" />
      {rows.map((y, i) => (
        <g key={y}>
          <circle cx={24} cy={y} r={3.4} className="f-s2" />
          <rect x={30} y={y - 1.5} width={i === 2 ? 8 : 12} height={3} rx={1.5} className="f-s2" />
          <path
            d={`M22.3 ${y}l1.3 1.4 2.6-2.9`}
            pathLength={1}
            className="va-anim st s-m"
            strokeWidth={1.9}
            style={a(`va-draw ${CYCLE} ease-out infinite both`, 0.15 + i * 0.3, { strokeDasharray: 1 })}
          />
        </g>
      ))}
    </>
  )
}

function Delivery() {
  return (
    <>
      <g className="va-anim" style={a("va-road 0.8s linear infinite")}>
        <path d="M2 55h72" className="st s-s2" strokeWidth={2.5} strokeDasharray="6 6" />
      </g>
      <path d="M2 26h4M0 32h5M2 38h3" className="st s-m" strokeWidth={2} opacity={0.5} />
      <g className="va-anim" style={a("va-jiggle 0.4s ease-in-out infinite")}>
        <rect x={8} y={18} width={30} height={24} rx={3} className="f-m" />
        <path d="M18 24h10v8H18z" className="f-h" opacity={0.3} />
        <path d="M38 26h9l7 8v8H38z" className="f-d" />
        <path d="M41 29h5l4.5 5H41z" className="f-h" opacity={0.85} />
      </g>
      {[18, 46].map((cx) => (
        <g key={cx} className="va-anim" style={a("va-roll 0.7s linear infinite")}>
          <circle cx={cx} cy={45} r={5.5} className="f-d" />
          <circle cx={cx} cy={45} r={2} className="f-h" />
          <path d={`M${cx} 40.5v2`} className="st s-h" strokeWidth={1.5} />
        </g>
      ))}
    </>
  )
}

function News() {
  return (
    <>
      <path d="M49 25a9 9 0 0 1 0 14" className="va-anim o-l st s-m" strokeWidth={2.5} style={a(`va-wave ${CYCLE} ease-out infinite both`, 0.15)} />
      <path d="M53 20a15 15 0 0 1 0 24" className="va-anim o-l st s-m" strokeWidth={2.5} style={a(`va-wave ${CYCLE} ease-out infinite both`, 0.32)} />
      <g className="va-anim" style={a(`va-tilt ${CYCLE} ease-in-out infinite`, 0, pivot(16, 36))}>
        <path d="M21 41l3 10h6l-2.5-9" className="f-d" />
        <path d="M14 25l26-12v38L14 39z" className="f-m" />
        <path d="M17 28l21-9" className="st s-h" strokeWidth={2} opacity={0.45} />
        <rect x={38} y={11} width={6} height={42} rx={3} className="f-d" />
        <rect x={8} y={24} width={9} height={16} rx={3} className="f-d" />
      </g>
    </>
  )
}

function Search() {
  return (
    <g className="va-anim" style={a("va-search 3.2s ease-in-out infinite")}>
      <path d="M38 38l12 12" className="st s-d" strokeWidth={7} />
      <circle cx={28} cy={28} r={13} className="f-h s-m" strokeWidth={4.5} />
      <path d="M21 24a8 8 0 0 1 6-5" className="st s-m" strokeWidth={2.5} opacity={0.5} />
    </g>
  )
}

function Room() {
  return (
    <>
      <path d="M40 15h5l-5 5h5" className="va-anim st s-m" strokeWidth={2} style={rise(0.2)} />
      <path d="M48 8h4l-4 4h4" className="va-anim st s-m" strokeWidth={1.8} style={rise(0.55)} />
      <rect x={8} y={22} width={6} height={32} rx={2.5} className="f-d" />
      <rect x={50} y={36} width={6} height={18} rx={2.5} className="f-d" />
      <rect x={10} y={38} width={44} height={10} rx={3} className="f-m" />
      <g className="va-anim o-b" style={a("va-throb 4.8s ease-in-out infinite")}>
        <path d="M24 38c0-6 4-8 10-8h16a4 4 0 0 1 4 4v4z" className="f-s2" />
        <path d="M27 36c1-2.5 3-3.5 6-3.5" className="st s-h" strokeWidth={1.8} opacity={0.7} />
      </g>
      <rect x={14} y={31} width={11} height={7} rx={3.5} className="f-h" />
    </>
  )
}

function Drawing({ kind, uid }: { kind: ArtKind; uid: string }): ReactNode {
  switch (kind) {
    case "room_service": return <RoomService />
    case "housekeeping": return <Housekeeping />
    case "maintenance": return <Maintenance />
    case "laundry": return <Laundry uid={uid} />
    case "shop": return <Shop />
    case "meals": return <Meals />
    case "rnr": return <Rnr />
    case "hse": return <Hse />
    case "facility":
    case "calendar": return <Facility />
    case "requests":
    case "tasks": return <Requests />
    case "delivery": return <Delivery />
    case "news": return <News />
    case "search": return <Search />
    case "room": return <Room />
  }
}

export function ServiceArt({
  kind,
  size = 56,
  motion = "hover",
  tone,
  bg = true,
  delay = 0,
  label,
  className = "",
}: {
  kind: ArtKind
  size?: number
  /** "hover" waits for a `.va-trigger` ancestor; "ambient" loops, offset by `delay`. */
  motion?: ArtMotion
  tone?: ArtTone
  /** Soft rounded tile behind the drawing */
  bg?: boolean
  /** Seconds to offset this drawing's loop — stagger a grid so tiles take turns */
  delay?: number
  /** Accessible name; omit when a visible label sits next to the drawing */
  label?: string
  className?: string
}) {
  const uid = useId().replace(/:/g, "")
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`va va-tone-${tone ?? DEFAULT_TONE[kind]} ${className}`}
      data-motion={motion}
      style={{ ["--va-delay" as string]: `${delay}s` }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {bg && <rect x={1} y={1} width={62} height={62} rx={20} className="f-s" />}
      <Drawing kind={kind} uid={uid} />
    </svg>
  )
}
