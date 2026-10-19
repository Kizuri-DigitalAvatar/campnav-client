"use client"

import { useState, type ElementType, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "convex-helpers/react/cache"
import {
  BedDouble, Camera, ChevronRight, ClipboardList, History, LifeBuoy, ListChecks, LogOut, MapPin, Palette,
  ShoppingBag, Sparkles, Star, UserPen,
} from "lucide-react"
import { api } from "../../../../convex/_generated/api"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"
import { useMyRoom } from "@/components/my-room"
import { ModeToggle } from "@/components/mode-toggle"
import { ContactSupportDialog } from "@/components/contact-support-dialog"
import { CountUp, ServiceArt } from "@/components/visuals"
import { CollectionItem, PageSkeleton, focusRing } from "@/components/collection"

const ACTIVE = ["pending", "acknowledged", "in_progress"]

// Reward levels: points needed to reach each one
const TIERS = [
  { name: "Bronze", from: 0, color: "from-amber-700 to-amber-500" },
  { name: "Silver", from: 1000, color: "from-slate-500 to-slate-400" },
  { name: "Gold", from: 2500, color: "from-yellow-500 to-amber-400" },
  { name: "Platinum", from: 5000, color: "from-indigo-500 to-violet-500" },
]

function tierFor(points: number) {
  let i = 0
  while (i + 1 < TIERS.length && points >= TIERS[i + 1].from) i++
  return { tier: TIERS[i], next: TIERS[i + 1] }
}

function roleLabel(role?: string) {
  if (!role) return "Member"
  return role.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ProfilePage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const { roomNumber } = useMyRoom()
  const [supportOpen, setSupportOpen] = useState(false)
  const staff = !!user && isWorker(user.role)

  // Live copies of what the profile shows (same cached queries as the other pages)
  const profile = useQuery(api.users.getProfile, user ? { id: user._id } : "skip")
  const requests = useQuery(api.requests.listForUser, user && !staff ? { userId: user._id } : "skip")
  const orders = useQuery(api.orders.listForUser, user && !staff ? { userId: user._id } : "skip")
  const tasks = useQuery(api.tasks.getWorkerAssignments, user && staff ? { workerId: user._id } : "skip")
  const points = useQuery(api.loyalty.getLoyaltyTransactions, user && !staff ? { userId: user._id, limit: 3 } : "skip")

  if (loading) return <PageSkeleton view="list" />
  if (!user) {
    return <div className="p-12 text-center text-xs italic text-muted-foreground">Please log in to view your profile.</div>
  }

  const image = profile?.imageUrl ?? user.image
  const pointTotal = profile?.points ?? user.points ?? 0
  const { tier, next } = tierFor(pointTotal)
  const progress = next ? ((pointTotal - tier.from) / (next.from - tier.from)) * 100 : 100

  const done = (tasks ?? []).filter((t: any) => t.status === "completed" || t.status === "rated")
  const rated = done.filter((t: any) => t.rating)
  const avg = rated.length ? rated.reduce((s: number, t: any) => s + t.rating, 0) / rated.length : 0

  const stats: { label: string; value: number; decimals?: number; suffix?: string; href: string; art: "requests" | "shop" | "tasks"; tone?: "emerald" | "amber" | "violet" }[] = staff
    ? [
      { label: "Tasks done", value: done.length, href: "/app/history", art: "tasks", tone: "emerald" },
      { label: "Avg rating", value: avg, decimals: 1, suffix: " ★", href: "/app/history", art: "tasks", tone: "amber" },
      { label: "Open now", value: (tasks ?? []).filter((t: any) => t.staffId && ACTIVE.includes(t.status)).length, href: "/app/assignments", art: "tasks" },
    ]
    : [
      { label: "Requests", value: (requests ?? []).length, href: "/app/requests", art: "requests" },
      { label: "Orders", value: (orders ?? []).length, href: "/app/history", art: "shop" },
      { label: "Rated", value: (requests ?? []).filter((r: any) => r.status === "rated").length, href: "/app/requests?filter=done", art: "requests", tone: "violet" },
    ]

  function signOut() {
    if (!confirm("Sign out of CampNav?")) return
    logout()
    router.push("/app/welcome")
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-10">
      {/* Who you are */}
      <section className="glass-card relative overflow-hidden rounded-3xl p-5 text-center sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/15 to-transparent" aria-hidden />
        <div className="relative mx-auto w-fit">
          <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-muted shadow-float">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-3xl font-black text-primary">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <Link
            href="/app/settings"
            aria-label="Change your photo"
            className={`absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-primary-glow transition-transform hover:scale-110 active:scale-95 ${focusRing}`}
          >
            <Camera className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <h1 className="relative mt-3 text-2xl font-black tracking-tight">{user.name}</h1>
        <p className="relative text-sm text-muted-foreground">{user.email}</p>
        <div className="relative mt-3 flex flex-wrap justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {roleLabel(user.role)}{staff && profile?.department ? ` · ${roleLabel(profile.department)}` : ""}
          </span>
          {staff ? (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${profile?.isOnSite ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-card text-muted-foreground"}`}>
              <MapPin className="h-3.5 w-3.5" aria-hidden />{profile?.isOnSite ? "On site" : "Off site"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-bold text-muted-foreground">
              <BedDouble className="h-3.5 w-3.5" aria-hidden />{roomNumber ? `Room ${roomNumber}` : "No room yet"}
            </span>
          )}
        </div>
      </section>

      {/* Numbers that matter, each opening the page behind it */}
      <ul className="grid grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <CollectionItem key={s.label} index={i}>
            <Link href={s.href} className={`va-trigger glass-card flex h-full flex-col items-center gap-1.5 rounded-2xl px-2 py-4 text-center transition-transform active:scale-95 ${focusRing}`}>
              <ServiceArt kind={s.art} tone={s.tone} size={36} />
              <span className="text-xl font-black tabular-nums leading-none">
                <CountUp value={s.value} decimals={s.decimals} suffix={s.suffix} />
              </span>
              <span className="text-[11px] font-semibold leading-tight text-muted-foreground">{s.label}</span>
            </Link>
          </CollectionItem>
        ))}
      </ul>

      {/* Camp rewards (residents & guests) */}
      {!staff && (
        <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tier.color} p-5 text-white shadow-float`}>
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" aria-hidden />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-85">Camp Rewards · {tier.name}</p>
              <p className="mt-1 text-3xl font-black tabular-nums"><CountUp value={pointTotal} /> <span className="text-base font-bold opacity-85">pts</span></p>
            </div>
            <Star className="h-8 w-8 fill-white/90 text-white/90 drop-shadow" aria-hidden />
          </div>
          <div className="relative mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label={next ? `Progress to ${next.name}` : "Top level reached"}>
              <div className="va-journey-fill h-full rounded-full bg-white" style={{ transform: `scaleX(${Math.min(100, progress) / 100})` }} />
            </div>
            <p className="mt-1.5 text-[11px] font-semibold opacity-90">
              {next ? `${(next.from - pointTotal).toLocaleString()} pts to ${next.name}` : "You've reached the top level 🎉"}
            </p>
          </div>
          {points && points.length > 0 && (
            <ul className="relative mt-4 space-y-1.5 border-t border-white/20 pt-3">
              {points.map((t: any) => {
                const plus = t.type === "earned"
                return (
                  <li key={t._id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate opacity-90">{t.reason}</span>
                    <span className="shrink-0 font-black tabular-nums">{plus ? "+" : "−"}{Math.abs(t.points)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {/* Everything else, grouped */}
      <MenuGroup title="Account">
        <MenuRow href="/app/settings" icon={UserPen} tone="text-primary" label="Edit profile" hint="Name, photo and contact details" />
        {!staff && <MenuRow href="/app/settings" icon={BedDouble} tone="text-indigo-500" label="My room" hint={roomNumber ? `Room ${roomNumber}` : "Not assigned yet"} />}
      </MenuGroup>

      <MenuGroup title="Activity">
        {staff ? (
          <>
            <MenuRow href="/app/assignments" icon={ClipboardList} tone="text-primary" label="My Tasks" hint="Work that needs you" />
            <MenuRow href="/app/history" icon={History} tone="text-emerald-600" label="Work History" hint="Finished tasks and ratings" />
          </>
        ) : (
          <>
            <MenuRow href="/app/requests" icon={ListChecks} tone="text-primary" label="My Requests" hint="Track every service you asked for" />
            <MenuRow href="/app/history" icon={ShoppingBag} tone="text-emerald-600" label="My Orders" hint="Shop and room service" />
            <MenuRow href="/app/requests?filter=done" icon={Star} tone="text-amber-500" label="Rated services" hint="Finished requests you can rate" />
          </>
        )}
      </MenuGroup>

      <MenuGroup title="Preferences">
        <li className="flex items-center gap-3 px-4 py-3">
          <RowIcon icon={Palette} tone="text-violet-500" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Appearance</span>
            <span className="block text-xs text-muted-foreground">Light or dark screen</span>
          </span>
          <ModeToggle />
        </li>
      </MenuGroup>

      <MenuGroup title="Help">
        <MenuRow onClick={() => setSupportOpen(true)} icon={LifeBuoy} tone="text-sky-600" label="Contact support" hint="Send a message to the camp team" />
      </MenuGroup>

      <button
        type="button"
        onClick={signOut}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/25 bg-rose-500/5 py-3.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-500/10 active:scale-[0.98] dark:text-rose-400 ${focusRing}`}
      >
        <LogOut className="h-4 w-4" aria-hidden /> Sign out
      </button>

      <ContactSupportDialog open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  )
}

function MenuGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</h2>
      <ul className="glass-card divide-y overflow-hidden rounded-2xl">{children}</ul>
    </section>
  )
}

function RowIcon({ icon: Icon, tone }: { icon: ElementType; tone: string }) {
  return (
    <span className="tile-3d flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
      <Icon className={`h-[18px] w-[18px] ${tone}`} aria-hidden />
    </span>
  )
}

function MenuRow({ href, onClick, icon, tone, label, hint }: {
  href?: string
  onClick?: () => void
  icon: ElementType
  tone: string
  label: string
  hint?: string
}) {
  const body = (
    <>
      <RowIcon icon={icon} tone={tone} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </>
  )
  // font-sans: buttons default to the display font globally; keep rows identical
  const cls = `group flex w-full items-center gap-3 px-4 py-3 text-left font-sans transition-colors hover:bg-muted/60 active:bg-muted outline-none focus-visible:bg-muted`
  return (
    <li>
      {href ? <Link href={href} className={cls}>{body}</Link> : <button type="button" onClick={onClick} className={cls}>{body}</button>}
    </li>
  )
}
