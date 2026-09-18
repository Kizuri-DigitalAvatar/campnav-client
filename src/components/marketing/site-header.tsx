"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, LayoutDashboard, LogIn, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { BrandMark } from "@/components/marketing/brand-mark"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
    { href: "/#platform", label: "Platform" },
    { href: "/#modules", label: "Modules" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#impact", label: "Results" },
    { href: "/#faq", label: "FAQ" },
]

export function SiteHeader() {
    const [scrolled, setScrolled] = useState(false)
    const [open, setOpen] = useState(false)
    const pathname = usePathname()
    const { user } = useAuth()

    // Visitors with a live session get a way straight back into the product
    const signedIn = !!user

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8)
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    // Close the mobile sheet whenever the route changes
    useEffect(() => setOpen(false), [pathname])

    // Lock body scroll behind the mobile sheet
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : ""
        return () => {
            document.body.style.overflow = ""
        }
    }, [open])

    return (
        <header
            className={cn(
                "fixed inset-x-0 top-0 z-50 transition-all duration-300",
                scrolled ? "py-2" : "py-3 md:py-4"
            )}
        >
            <div className="mx-auto w-full max-w-6xl px-4">
                <div
                    className={cn(
                        "flex h-14 items-center justify-between rounded-2xl px-3 md:px-4 transition-all duration-300",
                        scrolled
                            ? "glass-panel shadow-card"
                            : "border border-transparent"
                    )}
                >
                    <BrandMark />

                    <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:block">
                            <ModeToggle />
                        </div>
                        <Button variant="ghost" asChild className="hidden sm:inline-flex">
                            <Link href={signedIn ? "/campnav" : "/campnav/login"}>
                                {signedIn ? <LayoutDashboard className="size-4" /> : <LogIn className="size-4" />}
                                {signedIn ? "Open app" : "Log in"}
                            </Link>
                        </Button>
                        <Button asChild className="hidden rounded-full sm:inline-flex">
                            <Link href="/contact">
                                Book a demo
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>

                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            aria-label={open ? "Close menu" : "Open menu"}
                            aria-expanded={open}
                            className="flex size-10 items-center justify-center rounded-xl tile-3d sm:hidden"
                        >
                            {open ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile sheet */}
            <div
                className={cn(
                    "fixed inset-0 top-0 z-40 bg-background/95 backdrop-blur-xl transition-opacity duration-300 sm:hidden",
                    open ? "opacity-100" : "pointer-events-none opacity-0"
                )}
            >
                <div className="flex h-full flex-col px-6 pt-24 pb-10">
                    <nav className="flex flex-col gap-1" aria-label="Mobile">
                        {NAV_LINKS.map((link, i) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className="border-b border-border/60 py-4 text-xl font-bold tracking-tight transition-colors hover:text-primary"
                                style={{ transitionDelay: `${i * 30}ms` }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-auto space-y-3 pt-8">
                        <Button asChild size="lg" className="h-12 w-full rounded-full text-base">
                            <Link href="/contact">Book a demo</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-12 w-full rounded-full text-base">
                            <Link href={signedIn ? "/campnav" : "/campnav/login"}>
                                {signedIn ? "Open CampNav" : "Log in to CampNav"}
                            </Link>
                        </Button>
                        <div className="flex justify-center pt-2">
                            <ModeToggle />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
