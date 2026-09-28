"use client"

import { useEffect, useState } from "react"
import {
    BedDouble,
    Check,
    ConciergeBell,
    Shirt,
    Sparkles,
    Utensils,
    Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CampnavLogo } from "@/components/campnav-logo"

/**
 * Hero device mock: a phone running the resident app, walking through the life
 * of a single service request. The cycle is purely decorative — it is hidden
 * from assistive tech and freezes for prefers-reduced-motion users.
 */

const STAGES = [
    { label: "Request sent", caption: "Housekeeping · Room 214", progress: 18 },
    { label: "Assigned", caption: "Aminata K. accepted · 09:41", progress: 48 },
    { label: "In progress", caption: "On the way to your room", progress: 76 },
    { label: "Completed", caption: "Closed 09:58 · 17 min", progress: 100 },
]

const TILES = [
    { icon: ConciergeBell, label: "Room service", tone: "text-primary" },
    { icon: Shirt, label: "Laundry", tone: "text-sky-500" },
    { icon: Sparkles, label: "Housekeeping", tone: "text-violet-500" },
    { icon: Utensils, label: "Meals", tone: "text-amber-500" },
    { icon: Wrench, label: "Maintenance", tone: "text-emerald-500" },
    { icon: BedDouble, label: "My room", tone: "text-rose-500" },
]

export function DeviceMock({ className }: { className?: string }) {
    const [stage, setStage] = useState(0)

    useEffect(() => {
        const reduced =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        if (reduced) {
            setStage(STAGES.length - 1)
            return
        }

        const timer = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 2600)
        return () => clearInterval(timer)
    }, [])

    const current = STAGES[stage]

    return (
        <div className={cn("relative select-none", className)} aria-hidden="true">
            {/* Phone frame */}
            <div className="relative mx-auto w-[280px] rounded-[2.75rem] border border-border/70 bg-card p-2.5 shadow-pop sm:w-[300px]">
                <div className="relative overflow-hidden rounded-[2.25rem] bg-background">
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground">
                        <span>9:41</span>
                        <span className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-card" />
                        <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            LIVE
                        </span>
                    </div>

                    <div className="space-y-3.5 px-4 pb-5 pt-3">
                        {/* Greeting */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                    Good morning
                                </p>
                                <p className="text-base font-black tracking-tight">Room 214</p>
                            </div>
                            <CampnavLogo size={30} alt="" />
                        </div>

                        {/* Live request card */}
                        <div className="ring-gradient overflow-hidden rounded-2xl border bg-card p-3.5 shadow-card">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                                    Active request
                                </p>
                                <span
                                    className={cn(
                                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-colors duration-500",
                                        stage === 3
                                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                            : "bg-primary/10 text-primary"
                                    )}
                                >
                                    {stage === 3 ? <Check className="size-2.5" /> : null}
                                    {current.label}
                                </span>
                            </div>

                            <p className="mt-2 text-sm font-semibold leading-snug">Extra towels & linen</p>
                            <p className="text-[11px] text-muted-foreground">{current.caption}</p>

                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-[width] duration-[900ms] ease-out",
                                        stage === 3 ? "bg-emerald-500" : "bg-primary"
                                    )}
                                    style={{ width: `${current.progress}%` }}
                                />
                            </div>

                            <div className="mt-2.5 flex justify-between text-[9px] font-medium text-muted-foreground">
                                {STAGES.map((s, i) => (
                                    <span
                                        key={s.label}
                                        className={cn(
                                            "transition-colors duration-500",
                                            i <= stage && "font-bold text-foreground"
                                        )}
                                    >
                                        {s.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Quick access grid */}
                        <div>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                Request a service
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {TILES.map((tile, i) => (
                                    <div
                                        key={tile.label}
                                        className={cn(
                                            "tile-3d flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-center",
                                            i === 2 && stage < 3 && "animate-pulse-ring"
                                        )}
                                    >
                                        <tile.icon className={cn("size-4", tile.tone)} />
                                        <span className="text-[8.5px] font-semibold leading-tight text-muted-foreground">
                                            {tile.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Announcement strip */}
                        <div className="flex items-center gap-2.5 rounded-2xl border bg-card px-3 py-2.5">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_8px] shadow-red-500/60" />
                            <div className="min-w-0">
                                <p className="truncate text-[11px] font-semibold leading-tight">
                                    Water shutdown · Block B
                                </p>
                                <p className="text-[9px] text-muted-foreground">High priority · 08:00</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating dispatch card — desktop only */}
            <div className="absolute -right-4 top-16 hidden w-52 rounded-2xl border bg-card/95 p-3.5 shadow-float backdrop-blur-xl lg:block xl:-right-12">
                <div className="animate-float" style={{ "--tile-rot": "0deg", animationDelay: "-2s" } as React.CSSProperties}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Dispatch
                    </p>
                    <p className="mt-1 text-2xl font-black leading-none tracking-tight">
                        4<span className="text-sm font-bold text-muted-foreground">m avg</span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">pickup time today</p>
                    <div className="mt-3 flex items-end gap-1">
                        {[40, 62, 35, 78, 52, 88, 46].map((h, i) => (
                            <span
                                key={i}
                                className={cn(
                                    "flex-1 rounded-sm",
                                    i === 5 ? "bg-primary" : "bg-primary/25"
                                )}
                                style={{ height: `${h * 0.38}px` }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Floating staff card — desktop only */}
            <div className="absolute -left-6 bottom-20 hidden w-48 rounded-2xl border bg-card/95 p-3.5 shadow-float backdrop-blur-xl lg:block xl:-left-14">
                <div className="animate-float" style={{ animationDelay: "-4s" } as React.CSSProperties}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        On shift now
                    </p>
                    <div className="mt-2.5 space-y-2">
                        {[
                            { name: "Housekeeping", free: "3 free", tone: "bg-emerald-500" },
                            { name: "Maintenance", free: "2 free", tone: "bg-amber-500" },
                            { name: "Kitchen", free: "5 free", tone: "bg-emerald-500" },
                        ].map((row) => (
                            <div key={row.name} className="flex items-center justify-between text-[10px]">
                                <span className="flex items-center gap-1.5 font-medium">
                                    <span className={cn("size-1.5 rounded-full", row.tone)} />
                                    {row.name}
                                </span>
                                <span className="font-bold text-muted-foreground">{row.free}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
