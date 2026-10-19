"use client"

import { useState, type ElementType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Bell, Brush, ChevronDown, ClipboardList, Grid2X2, History, Home, Inbox, ListChecks, ShoppingBag, Shirt,
    Truck, User, Utensils, Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"

/*
 * The one navigation list for the signed-in app. The desktop sidebar and the
 * mobile slide-in menu both render <NavList />, so the items, wording, order
 * and look are identical on every screen size.
 */

export interface NavItem {
    href: string
    label: string
    icon: ElementType
    subItems?: NavItem[]
}

const SERVICE_ITEMS: NavItem[] = [
    { href: "/app/room-service", label: "Room Service", icon: Utensils },
    { href: "/app/house-keeping", label: "Housekeeping", icon: Brush },
    { href: "/app/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/app/laundry", label: "Laundry", icon: Shirt },
    { href: "/app/shop", label: "Online Shop", icon: ShoppingBag },
    { href: "/app/delivery", label: "Delivery", icon: Truck },
]

const STAFF_ITEMS: NavItem[] = [
    { href: "/app", label: "Home", icon: Home },
    { href: "/app/assignments", label: "My Tasks", icon: ClipboardList },
    { href: "/app/available-tasks", label: "Available Tasks", icon: Inbox },
    { href: "/app/history", label: "Work History", icon: History },
    { href: "/app/shop", label: "Shop", icon: ShoppingBag },
    { href: "/app/updates", label: "Updates", icon: Bell },
    { href: "/app/profile", label: "Profile", icon: User },
]

const RESIDENT_ITEMS: NavItem[] = [
    { href: "/app", label: "Home", icon: Home },
    { href: "/app/services", label: "Services", icon: Grid2X2, subItems: SERVICE_ITEMS },
    { href: "/app/requests", label: "My Requests", icon: ListChecks },
    { href: "/app/history", label: "My Orders", icon: ShoppingBag },
    { href: "/app/updates", label: "Updates", icon: Bell },
    { href: "/app/profile", label: "Profile", icon: User },
]

export function useNavItems() {
    const { user, loading } = useAuth()
    return { items: user && isWorker(user.role) ? STAFF_ITEMS : RESIDENT_ITEMS, loading }
}

/** Home matches exactly; every other item also owns its sub-pages (e.g. a task's own page). */
export function isActive(pathname: string, href: string) {
    return href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`)
}

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname()
    const { items, loading } = useNavItems()
    const onServicePage = SERVICE_ITEMS.some((s) => isActive(pathname, s.href))
    const [openSub, setOpenSub] = useState<string | null>(onServicePage ? "Services" : null)

    if (loading) {
        return (
            <div className="space-y-1" aria-busy="true">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
                        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <ul className="space-y-1">
            {items.map((item) => {
                const active = isActive(pathname, item.href) || (!!item.subItems && onServicePage)
                const expanded = openSub === item.label
                return (
                    <li key={item.href}>
                        <div className="flex items-center gap-1">
                            <Link
                                href={item.href}
                                onClick={onNavigate}
                                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                                className={cn(
                                    "group flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                    active
                                        ? "bg-primary text-primary-foreground shadow-primary-glow"
                                        : "text-muted-foreground hover:translate-x-0.5 hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <span className={cn(
                                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                                    active ? "bg-white/15" : "tile-3d"
                                )}>
                                    <item.icon className={cn("h-[18px] w-[18px]", active ? "text-primary-foreground" : "text-primary")} aria-hidden />
                                </span>
                                <span className="truncate">{item.label}</span>
                            </Link>
                            {item.subItems && (
                                <button
                                    type="button"
                                    onClick={() => setOpenSub(expanded ? null : item.label)}
                                    aria-expanded={expanded}
                                    aria-label={`${expanded ? "Hide" : "Show"} ${item.label.toLowerCase()} list`}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")} aria-hidden />
                                </button>
                            )}
                        </div>

                        {item.subItems && expanded && (
                            <ul className="mt-1 ml-[1.6rem] space-y-0.5 border-l pl-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                {item.subItems.map((sub) => {
                                    const subActive = isActive(pathname, sub.href)
                                    return (
                                        <li key={sub.href}>
                                            <Link
                                                href={sub.href}
                                                onClick={onNavigate}
                                                aria-current={subActive ? "page" : undefined}
                                                className={cn(
                                                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                                    subActive ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                <sub.icon className="h-4 w-4 shrink-0" aria-hidden />
                                                <span className="truncate">{sub.label}</span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}

// ── Bottom tab bar (phones) ────────────────────────────────────────────────
// The five places people go most, one tap away. Everything else stays in the menu.

export const STAFF_TABS: NavItem[] = [
    { href: "/app", label: "Home", icon: Home },
    { href: "/app/assignments", label: "My Tasks", icon: ClipboardList },
    { href: "/app/available-tasks", label: "Available", icon: Inbox },
    { href: "/app/history", label: "History", icon: History },
    { href: "/app/updates", label: "Updates", icon: Bell },
]

export const RESIDENT_TABS: NavItem[] = [
    { href: "/app", label: "Home", icon: Home },
    { href: "/app/services", label: "Services", icon: Grid2X2 },
    { href: "/app/requests", label: "Requests", icon: ListChecks },
    { href: "/app/history", label: "Orders", icon: ShoppingBag },
    { href: "/app/updates", label: "Updates", icon: Bell },
]
