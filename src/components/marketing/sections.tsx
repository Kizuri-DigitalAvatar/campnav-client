import Link from "next/link"
import {
    ArrowRight,
    Check,
    HardHat,
    LayoutDashboard,
    type LucideIcon,
    UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/marketing/reveal"
import { SectionHeading } from "@/components/marketing/section-heading"
import { AUDIENCES, CONTACT, STEPS } from "@/components/marketing/content"

const AUDIENCE_ICONS: Record<string, LucideIcon> = {
    UserRound,
    HardHat,
    LayoutDashboard,
}

export function HowItWorks() {
    return (
        <section id="how-it-works" className="scroll-mt-24 py-20 md:py-28">
            <div className="mx-auto w-full max-w-6xl px-4">
                <SectionHeading
                    eyebrow="How it works"
                    title="Live in weeks,"
                    accent="not quarters"
                    body="CAMPNAV is configured around the camp you already run — no reorganisation required before you see value."
                />

                <div className="relative mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
                    {/* Connecting rail */}
                    <div
                        className="pointer-events-none absolute left-0 right-0 top-[3.25rem] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
                        aria-hidden="true"
                    />

                    {STEPS.map((step, index) => (
                        <Reveal key={step.title} delay={index * 110}>
                            <div className="relative h-full rounded-3xl border bg-card/70 p-6 shadow-card backdrop-blur-sm transition-transform duration-300 card-lift">
                                <span className="flex size-12 items-center justify-center rounded-2xl tile-3d-primary text-lg font-black text-primary-foreground">
                                    {index + 1}
                                </span>
                                <h3 className="mt-5 text-lg font-bold tracking-tight">{step.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}

export function Audiences() {
    return (
        <section id="audiences" className="scroll-mt-24 border-y bg-card/30 py-20 md:py-28">
            <div className="mx-auto w-full max-w-6xl px-4">
                <SectionHeading
                    eyebrow="Built for everyone on site"
                    title="Three views,"
                    accent="one system of record"
                    body="Residents, staff and management each see exactly what they need — and every action lands in the same operational record."
                />

                <div className="mt-14 grid gap-6 md:grid-cols-3">
                    {AUDIENCES.map((audience, index) => {
                        const Icon = AUDIENCE_ICONS[audience.icon] ?? UserRound
                        return (
                            <Reveal key={audience.id} delay={index * 110}>
                                <div className="group flex h-full flex-col rounded-3xl border bg-card p-7 shadow-card transition-all duration-300 card-lift hover:border-primary/40">
                                    <span className="flex size-12 items-center justify-center rounded-2xl tile-3d text-primary transition-transform duration-300 group-hover:-translate-y-0.5">
                                        <Icon className="size-5" />
                                    </span>
                                    <h3 className="mt-5 text-xl font-black tracking-tight">{audience.title}</h3>
                                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                                        {audience.body}
                                    </p>
                                    <ul className="mt-6 space-y-2.5 border-t pt-5">
                                        {audience.features.map((feature) => (
                                            <li key={feature} className="flex items-center gap-2.5 text-sm font-medium">
                                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                                                    <Check className="size-3" strokeWidth={3} />
                                                </span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Reveal>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export function CtaBand() {
    return (
        <section className="aurora relative overflow-hidden py-20 md:py-28">
            <div className="relative z-10 mx-auto w-full max-w-4xl px-4 text-center">
                <Reveal>
                    <h2 className="text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl md:leading-[1.05]">
                        See CAMPNAV running{" "}
                        <span className="text-gradient">on your camp</span>
                    </h2>
                </Reveal>
                <Reveal delay={90}>
                    <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                        Book a 30-minute walkthrough. We will show the resident app, the staff
                        dispatch flow and the management dashboard using a setup that mirrors your site.
                    </p>
                </Reveal>
                <Reveal delay={160}>
                    <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                        <Button asChild size="lg" className="h-12 rounded-full px-8 text-base">
                            <Link href="/contact">
                                Book a demo
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-8 text-base">
                            <Link href={`mailto:${CONTACT.email}`}>Email the team</Link>
                        </Button>
                    </div>
                </Reveal>
                <Reveal delay={220}>
                    <p className="mt-5 text-xs text-muted-foreground">{CONTACT.responsePromise}</p>
                </Reveal>
            </div>
        </section>
    )
}
