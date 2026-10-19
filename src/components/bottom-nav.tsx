"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "../../convex/_generated/api"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"
import { RESIDENT_TABS, STAFF_TABS, isActive } from "@/components/app-nav"
import { needsConfirmation } from "@/components/order-card"

const ACTIVE = ["pending", "acknowledged", "in_progress"]

/**
 * Phone tab bar: the main places one tap away, with live badges for things
 * waiting on the user (tasks to do, open tasks to claim, orders to confirm).
 */
export function BottomNav() {
    const pathname = usePathname()
    const { user } = useAuth()
    const staff = !!user && isWorker(user.role)

    // Same queries the pages use, so these come from the shared cache
    const myTasks = useQuery(api.tasks.getWorkerAssignments, user && staff ? { workerId: user._id } : "skip")
    const openTasks = useQuery(api.tasks.getOpenTasks, user && staff ? {} : "skip")
    const requests = useQuery(api.requests.listForUser, user && !staff ? { userId: user._id } : "skip")
    const orders = useQuery(api.orders.listForUser, user && !staff ? { userId: user._id } : "skip")

    if (!user) return null

    const badges: Record<string, number> = staff
        ? {
            "/app/assignments": (myTasks ?? []).filter((t: any) => t.staffId && ACTIVE.includes(t.status)).length,
            "/app/available-tasks": (openTasks ?? []).length,
        }
        : {
            "/app/requests": (requests ?? []).filter((r: any) => ACTIVE.includes(r.status)).length,
            "/app/history": (orders ?? []).filter(needsConfirmation).length,
        }
    const tabs = staff ? STAFF_TABS : RESIDENT_TABS

    return (
        <nav
            aria-label="Quick navigation"
            className="fixed inset-x-0 bottom-0 z-40 border-t glass-panel pb-[env(safe-area-inset-bottom)] md:hidden"
        >
            <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
                {tabs.map((tab) => {
                    const active = isActive(pathname, tab.href)
                    const badge = badges[tab.href] ?? 0
                    return (
                        <li key={tab.href}>
                            <Link
                                href={tab.href}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "group flex h-full flex-col items-center justify-center gap-0.5 outline-none focus-visible:bg-muted/60 active:scale-95 transition-transform",
                                    active ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                <span className={cn(
                                    "relative flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-300",
                                    active && "bg-primary/12"
                                )}>
                                    <tab.icon
                                        key={active ? "on" : "off"}
                                        className={cn("h-[22px] w-[22px]", active && "va-nav-pop")}
                                        strokeWidth={active ? 2.4 : 2}
                                        aria-hidden
                                    />
                                    {badge > 0 && (
                                        <span className="absolute -top-0.5 right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
                                            {badge > 9 ? "9+" : badge}
                                        </span>
                                    )}
                                </span>
                                <span className={cn("text-[10px] leading-none", active ? "font-bold" : "font-medium")}>
                                    {tab.label}
                                    {badge > 0 && <span className="sr-only">, {badge} waiting</span>}
                                </span>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
