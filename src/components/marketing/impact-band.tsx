"use client"

import { useEffect, useRef, useState } from "react"
import { IMPACT } from "@/components/marketing/content"

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
            <p className="text-4xl font-black tracking-tighter sm:text-5xl">
                {current}
                <span className="text-gradient">{suffix}</span>
            </p>
            <p className="mx-auto mt-2 max-w-[15rem] text-sm leading-snug text-muted-foreground">{label}</p>
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
                    className="ring-gradient grid gap-10 rounded-3xl border bg-card/60 px-6 py-12 shadow-card backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-4"
                >
                    {IMPACT.map((stat) => (
                        <Stat key={stat.label} {...stat} run={run} />
                    ))}
                </div>
            </div>
        </section>
    )
}
