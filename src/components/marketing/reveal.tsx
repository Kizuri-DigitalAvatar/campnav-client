"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Fades + lifts its children into view once, the first time they intersect.
 * Motion is disabled wholesale by the prefers-reduced-motion rule in globals.css.
 */
export function Reveal({
    children,
    className,
    delay = 0,
    as: Tag = "div",
}: {
    children: React.ReactNode
    className?: string
    delay?: number
    as?: React.ElementType
}) {
    const ref = useRef<HTMLElement>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        // No IntersectionObserver (or SSR-less browsers): show immediately.
        if (typeof IntersectionObserver === "undefined") {
            setVisible(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return (
        <Tag
            ref={ref}
            className={cn("reveal", visible && "is-visible", className)}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </Tag>
    )
}
