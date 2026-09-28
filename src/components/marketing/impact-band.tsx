"use client"

import { useEffect, useRef, useState } from "react"
import { IMPACT } from "@/components/marketing/content"
import { MARKETING_IMAGES } from "@/components/marketing/images"
import { BACKDROP_WIDTHS, MarketingImage } from "@/components/marketing/marketing-image"

/** Counts from 0 to `target` once the band scrolls into view. */
function useCountUp(target: number, run: boolean, duration = 1100) {
    const [value, setValue] = useState(0)

    useEffect(() => {
        if (!run) return

        const reduced =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        if (reduced) {
            setValue(target)
            return
        }

        let frame = 0
        const start = performance.now()

        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(target * eased))
            if (progress < 1) frame = requestAnimationFrame(tick)
        }

        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [target, run, duration])

    return value
}

function Stat({ value, suffix, label, run }: { value: number; suffix: string; label: string; run: boolean }) {
    const current = useCountUp(value, run)

    return (
        <div className="text-center">
            {/*
             * Fixed light colours rather than theme tokens: this band sits on a
             * dark scrim over the photograph in both themes, so the usual
             * foreground tokens would disappear into it in light mode.
             */}
            <p className="text-4xl font-black tracking-tighter text-white sm:text-5xl">
                {current}
                <span className="text-sky-300">{suffix}</span>
            </p>
            <p className="mx-auto mt-2 max-w-[15rem] text-sm leading-snug text-white/75">{label}</p>
        </div>
    )
}

export function ImpactBand() {
    const ref = useRef<HTMLDivElement>(null)
    const [run, setRun] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        if (typeof IntersectionObserver === "undefined") {
            setRun(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setRun(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.35 }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return (
        <section id="impact" className="scroll-mt-24 py-16 md:py-20">
            <div className="mx-auto w-full max-w-6xl px-4">
                <div
                    ref={ref}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-card"
                >
                    <MarketingImage
                        slot={MARKETING_IMAGES.impactBackdrop.slot}
                        alt=""
                        ratio="21:9"
                        sizes="(min-width: 1280px) 1280px, 100vw"
                        widths={BACKDROP_WIDTHS}
                        className="absolute inset-0"
                    />
                    {/* The stats are the subject here; the photograph is texture. */}
                    <div
                        className="absolute inset-0 bg-slate-950/70 dark:bg-slate-950/80"
                        aria-hidden="true"
                    />

                    <div className="relative grid gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
                        {IMPACT.map((stat) => (
                            <Stat key={stat.label} {...stat} run={run} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
