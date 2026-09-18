"use client"

import { useRef, useState } from "react"
import {
    BarChart3,
    BedDouble,
    Check,
    ConciergeBell,
    type LucideIcon,
    Megaphone,
    ShieldCheck,
    Users,
    Utensils,
    Wrench,
} from "lucide-react"
import { MODULES } from "@/components/marketing/content"
import { cn } from "@/lib/utils"

const ICONS: Record<string, LucideIcon> = {
    ConciergeBell,
    Users,
    Utensils,
    Wrench,
    ShieldCheck,
    BedDouble,
    Megaphone,
    BarChart3,
}

const STATE_STYLES = {
    done: {
        dot: "bg-emerald-500",
        badge: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
        label: "Done",
    },
    active: {
        dot: "bg-primary",
        badge: "bg-primary/12 text-primary",
        label: "Active",
    },
    queued: {
        dot: "bg-amber-500",
        badge: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
        label: "Queued",
    },
} as const

export function ModuleExplorer() {
    const [active, setActive] = useState(0)
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

    const module = MODULES[active]
    const ActiveIcon = ICONS[module.icon] ?? ConciergeBell

    const onKeyDown = (event: React.KeyboardEvent) => {
        const last = MODULES.length - 1
        let next: number | null = null

        if (event.key === "ArrowDown" || event.key === "ArrowRight") next = active === last ? 0 : active + 1
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = active === 0 ? last : active - 1
        if (event.key === "Home") next = 0
        if (event.key === "End") next = last

        if (next !== null) {
            event.preventDefault()
            setActive(next)
            tabRefs.current[next]?.focus()
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr] lg:gap-10">
            {/* Module list */}
            <div
                role="tablist"
                aria-label="CAMPNAV modules"
                aria-orientation="vertical"
                onKeyDown={onKeyDown}
                className="flex gap-2 overflow-x-auto pb-2 edge-fade lg:flex-col lg:overflow-visible lg:pb-0 lg:[mask-image:none] lg:[-webkit-mask-image:none]"
            >
                {MODULES.map((item, index) => {
                    const Icon = ICONS[item.icon] ?? ConciergeBell
                    const selected = index === active

                    return (
                        <button
                            key={item.id}
                            ref={(el) => {
                                tabRefs.current[index] = el
                            }}
                            role="tab"
                            id={`module-tab-${item.id}`}
                            aria-selected={selected}
                            aria-controls={`module-panel-${item.id}`}
                            tabIndex={selected ? 0 : -1}
                            onClick={() => setActive(index)}
                            className={cn(
                                "group flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 outline-none",
                                "focus-visible:ring-4 focus-visible:ring-ring/25",
                                selected
                                    ? "border-primary/40 bg-card shadow-card lg:translate-x-1"
                                    : "border-transparent bg-card/40 hover:border-border hover:bg-card"
                            )}
                        >
                            <span
                                className={cn(
                                    "flex size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
                                    selected ? "tile-3d-primary text-primary-foreground" : "tile-3d text-primary"
                                )}
                            >
                                <Icon className="size-[18px]" />
                            </span>
                            <span className="min-w-0">
                                <span className="block whitespace-nowrap text-sm font-bold tracking-tight lg:whitespace-normal">
                                    {item.name}
                                </span>
                                <span className="hidden text-xs leading-snug text-muted-foreground lg:block">
                                    {item.tagline}
                                </span>
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Detail panel */}
            <div
                role="tabpanel"
                id={`module-panel-${module.id}`}
                aria-labelledby={`module-tab-${module.id}`}
                key={module.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
                <div className="ring-gradient grid h-full gap-8 rounded-3xl border bg-card/70 p-6 shadow-card backdrop-blur-sm md:grid-cols-2 md:p-8">
                    <div className="flex flex-col">
                        <span className="flex size-12 items-center justify-center rounded-2xl tile-3d-primary text-primary-foreground">
                            <ActiveIcon className="size-5" />
                        </span>
                        <h3 className="mt-5 text-2xl font-black tracking-tight">{module.name}</h3>
                        <p className="mt-1.5 text-sm font-medium text-primary">{module.tagline}</p>

                        <ul className="mt-6 space-y-3.5">
                            {module.points.map((point) => (
                                <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                                        <Check className="size-3" strokeWidth={3} />
                                    </span>
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Mock screen for the selected module */}
                    <div className="rounded-2xl border bg-background/60 p-4 shadow-[inset_0_1px_2px_rgb(16_24_40_/_0.04)]">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-bold tracking-tight">{module.preview.title}</p>
                                <p className="text-[11px] text-muted-foreground">{module.preview.subtitle}</p>
                            </div>
                            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Live
                            </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {module.preview.chips.map((chip) => (
                                <div key={chip.label} className="rounded-xl border bg-card px-3 py-2.5">
                                    <p className="text-lg font-black leading-none tracking-tight">{chip.value}</p>
                                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                        {chip.label}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 space-y-2">
                            {module.preview.rows.map((row, i) => {
                                const style = STATE_STYLES[row.state]
                                return (
                                    <div
                                        key={row.label}
                                        className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 animate-in fade-in slide-in-from-right-2"
                                        style={{ animationDelay: `${i * 70}ms`, animationFillMode: "backwards" }}
                                    >
                                        <span className={cn("size-2 shrink-0 rounded-full", style.dot)} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold leading-tight">{row.label}</p>
                                            <p className="truncate text-[10px] text-muted-foreground">{row.meta}</p>
                                        </div>
                                        <span
                                            className={cn(
                                                "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                                                style.badge
                                            )}
                                        >
                                            {style.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
