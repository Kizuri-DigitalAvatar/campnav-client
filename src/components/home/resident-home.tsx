"use client"

import Link from "next/link"
import { useQuery } from "convex-helpers/react/cache"
import {
  AlertTriangle, BedDouble, CalendarDays, ClipboardList, Clock, MapPin, Megaphone, ShoppingBag,
} from "lucide-react"

import { api } from "../../../convex/_generated/api"
import { useMyRoom } from "@/components/my-room"
import { ReceptionContactCard } from "@/components/reception-contact"
import {
  DashboardHeader, EmptyState, ListRow, Panel, Pill, StatTile, dayLabel, focusRing, timeAgo,
} from "@/components/home/dashboard-ui"
import { ServiceArt, artForType, useSpotlight, type ArtKind } from "@/components/visuals"
import { CampUpdates } from "@/components/home/camp-updates"

const QUICK_ACTIONS: { label: string; href: string; art: ArtKind }[] = [
  { label: "Room Service", href: "/app/room-service", art: "room_service" },
  { label: "Housekeeping", href: "/app/house-keeping", art: "housekeeping" },
  { label: "Maintenance", href: "/app/maintenance/request", art: "maintenance" },
  { label: "Laundry", href: "/app/laundry", art: "laundry" },
  { label: "Shop", href: "/app/shop", art: "shop" },
  { label: "Meals", href: "/app/meals", art: "meals" },
]

const ACTIVE = ["pending", "acknowledged", "in_progress"]
export function ResidentHome({ user }: { user: any }) {
  const { roomNumber, loading: roomLoading } = useMyRoom()
  const requests = useQuery(api.requests.listForUser, { userId: user._id })
  const orders = useQuery(api.orders.listForUser, { userId: user._id })
  const announcements = useQuery(api.announcements.list, { priority: "all" })
  const activities = useQuery(api.activities.list)
  const spotlight = useSpotlight(QUICK_ACTIONS.length)

  const activeRequests = (requests ?? []).filter((r: any) => ACTIVE.includes(r.status))
  const openOrders = (orders ?? []).filter((o: any) => ACTIVE.includes(o.status))
  const recentRequests = [...(requests ?? [])]
    .sort((a: any, b: any) =>
      Number(ACTIVE.includes(b.status)) - Number(ACTIVE.includes(a.status)) || b.createdAt - a.createdAt)
    .slice(0, 4)
  const recentOrders = (orders ?? []).slice(0, 3)

  const startOfToday = new Date().setHours(0, 0, 0, 0)
  const upcoming = (activities ?? [])
    .filter((a: any) => a.date >= startOfToday)
    .sort((a: any, b: any) => a.date - b.date)
  const weekEvents = upcoming.filter((a: any) => a.date < startOfToday + 7 * 86400000)
  const newThisWeek = (announcements ?? []).filter((a: any) => (a.createdAt || 0) > Date.now() - 7 * 86400000).length

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-8">
      <DashboardHeader
        name={user.name}
        subtitle="Here's what's happening with your stay."
        badges={
          roomLoading ? null : roomNumber ? (
            <Pill icon={BedDouble} tone="primary">Room {roomNumber}</Pill>
          ) : (
            <Pill icon={AlertTriangle} tone="warning">No room assigned yet</Pill>
          )
        }
      />

      {/* Announcements and events, seen first */}
      <CampUpdates />

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-4">
        <StatTile
          label="Active requests" icon={ClipboardList} href="/app/requests" tone="primary"
          value={activeRequests.length} loading={requests === undefined}
          hint={requests ? `${requests.length} total` : undefined}
        />
        <StatTile
          label="Open orders" icon={ShoppingBag} href="/app/history" tone="amber"
          value={openOrders.length} loading={orders === undefined}
          hint={orders ? `${orders.length} total` : undefined}
        />
        <StatTile
          label="Events this week" icon={CalendarDays} href="/app/updates?tab=activities&view=calendar" tone="violet"
          value={weekEvents.length} loading={activities === undefined}
          hint={upcoming[0] ? `Next: ${upcoming[0].title}` : "Nothing scheduled"}
        />
        <StatTile
          label="New announcements" icon={Megaphone} href="/app/updates" tone="emerald"
          value={newThisWeek} loading={announcements === undefined}
          hint="In the last 7 days"
        />
      </div>

      {/* Quick actions */}
      <nav aria-label="Quick actions">
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6 md:gap-4">
          {QUICK_ACTIONS.map(({ label, href, art }, i) => (
            <li key={href}>
              <Link
                href={href}
                className={`va-trigger glass-card card-lift flex h-full flex-col items-center gap-2 px-2 py-4 text-center ${spotlight === i ? "va-live" : ""} ${focusRing}`}
              >
                <ServiceArt kind={art} size={52} />
                <span className="text-xs font-semibold leading-tight">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <ReceptionContactCard className="lg:hidden" />

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="min-w-0 space-y-4 md:space-y-6 lg:col-span-2">
          <Panel title="My requests" icon={ClipboardList} action={{ label: "View all", href: "/app/requests" }}>
            {requests === undefined ? (
              <RowSkeleton />
            ) : recentRequests.length === 0 ? (
              <EmptyState
                art="requests"
                title="No requests yet"
                hint="Need something fixed, cleaned or washed? We're on it."
                action={{ label: "Make a request", href: "/app/services" }}
              />
            ) : (
              <ul className="space-y-1">
                {recentRequests.map((r: any) => {
                  return (
                    <ListRow
                      key={r._id}
                      href={`/app/requests/${r._id}`}
                      icon={r.imageUrl
                        ? <img src={r.imageUrl} alt="" className="h-full w-full object-cover" />
                        : <ServiceArt kind={artForType(r.type)} size={40} motion={r.status === "in_progress" ? "always" : "none"} />}
                      title={r.description}
                      meta={<><span className="capitalize">{r.type?.replace("_", " ")}</span> · {timeAgo(r.createdAt)}</>}
                      status={r.status}
                    />
                  )
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Recent orders" icon={ShoppingBag} action={{ label: "My orders", href: "/app/history" }}>
            {orders === undefined ? (
              <RowSkeleton />
            ) : recentOrders.length === 0 ? (
              <EmptyState
                art="shop"
                title="No orders yet"
                hint="Order food, drinks and essentials to your room."
                action={{ label: "Browse the shop", href: "/app/shop" }}
              />
            ) : (
              <ul className="space-y-1">
                {recentOrders.map((o: any) => {
                  const image = o.items?.find((i: any) => i.imageUrl)?.imageUrl ?? o.productImage
                  const names = o.items?.length ? o.items.map((i: any) => i.name).join(", ") : o.summary
                  return (
                    <ListRow
                      key={o._id}
                      href="/app/history"
                      icon={image
                        ? <img src={image} alt="" className="h-full w-full object-cover" />
                        : <ServiceArt kind={o.source === "room_service" ? "room_service" : "shop"} size={40} motion="none" />}
                      title={names}
                      meta={<>{o.source === "room_service" ? "Room service" : "Shop"} · Le {o.total.toFixed(2)} · {timeAgo(o.createdAt)}</>}
                      status={o.status}
                    />
                  )
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* Side column */}
        <div className="min-w-0 space-y-4 md:space-y-6">
          <ReceptionContactCard className="hidden lg:block" />
          <Panel title="This week" icon={CalendarDays} action={{ label: "Calendar", href: "/app/updates?tab=activities&view=calendar" }}>
            {activities === undefined ? (
              <RowSkeleton />
            ) : weekEvents.length === 0 ? (
              <EmptyState art="calendar" title="Nothing scheduled" hint="Check back for camp events." />
            ) : (
              <ul className="space-y-2">
                {weekEvents.slice(0, 4).map((e: any) => (
                  <li key={e._id}>
                    <Link
                      href={`/app/updates/activities/${e._id}`}
                      className={`flex gap-3 rounded-xl border bg-card/60 p-3 transition-colors hover:border-primary/40 ${focusRing}`}
                    >
                      <span className="flex w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 py-1 text-primary">
                        <span className="text-[10px] font-bold uppercase">{new Date(e.date).toLocaleDateString(undefined, { month: "short" })}</span>
                        <span className="text-lg font-black leading-none">{new Date(e.date).getDate()}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{e.title}</span>
                        <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{dayLabel(e.date)} · {e.time}</span>
                          {e.location && <span className="inline-flex items-center gap-1 truncate"><MapPin className="h-3 w-3" aria-hidden />{e.location}</span>}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}

export function RowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
