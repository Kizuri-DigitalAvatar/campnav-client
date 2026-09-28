"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { COMPARISON } from "@/components/marketing/content"
import { MARKETING_IMAGES } from "@/components/marketing/images"
import { CARD_WIDTHS, MarketingImage } from "@/components/marketing/marketing-image"
import { cn } from "@/lib/utils"

type Side = "before" | "after"

export function Comparison() {
    const [side, setSide] = useState<Side>("after")
    const active = COMPARISON[side]
    const isAfter = side === "after"

    return (
        <div className="mx-auto mt-12 max-w-3xl">
            {/* Toggle */}
            <div className="mx-auto flex w-full max-w-md rounded-full border bg-card p-1 shadow-card">
                {(["before", "after"] as Side[]).map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setSide(key)}
                        aria-pressed={side === key}
                        className={cn(
                            "flex-1 rounded-full px-4 py-2.5 text-sm font-bold tracking-tight transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-ring/25",
                            side === key
                                ? key === "after"
                                    ? "tile-3d-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {COMPARISON[key].title}
                    </button>
                ))}
            </div>

            {/* Panel */}
            <div
                key={side}
                className={cn(
                    "mt-6 overflow-hidden rounded-3xl border shadow-card transition-colors duration-300",
                    "animate-in fade-in slide-in-from-bottom-2 duration-400",
                    isAfter ? "border-primary/30 bg-card" : "bg-muted/40"
                )}
            >
                {/*
                 * Only the "after" side has a photograph — the matching
                 * radio-and-paper shot has not been generated yet, so the
                 * "before" panel stays text-only rather than borrowing an
                 * image that shows the wrong thing.
                 */}
                {isAfter && (
                    <div className="relative h-36 sm:h-44">
                        <MarketingImage
                            slot={MARKETING_IMAGES.afterDispatch.slot}
                            alt={MARKETING_IMAGES.afterDispatch.alt}
                            ratio="4:3"
                            sizes="(min-width: 768px) 768px, 100vw"
                            widths={CARD_WIDTHS}
                            className="dark:brightness-90"
                        />
                        <div
                            className="absolute inset-0 bg-gradient-to-t from-card to-transparent"
                            aria-hidden="true"
                        />
                    </div>
                )}

                <ul className="space-y-4 p-6 md:p-8">
                    {active.points.map((point, i) => (
                        <li
                            key={point}
                            className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2"
                            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
                        >
                            <span
                                className={cn(
                                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                                    isAfter
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                        : "bg-destructive/12 text-destructive"
                                )}
                            >
                                {isAfter ? (
                                    <Check className="size-3.5" strokeWidth={3} />
                                ) : (
                                    <X className="size-3.5" strokeWidth={3} />
                                )}
                            </span>
                            <span
                                className={cn(
                                    "text-sm leading-relaxed sm:text-base",
                                    isAfter ? "font-medium" : "text-muted-foreground"
                                )}
                            >
                                {point}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
