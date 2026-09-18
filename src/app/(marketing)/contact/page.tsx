import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CalendarClock, Clock, Mail, MapPin, Phone, ShieldCheck } from "lucide-react"
import { DemoForm } from "@/components/marketing/demo-form"
import { Reveal } from "@/components/marketing/reveal"
import { CONTACT } from "@/components/marketing/content"

export const metadata: Metadata = {
    title: "Book a demo",
    description:
        "See CAMPNAV running on a setup that mirrors your camp. Book a 30-minute walkthrough of resident requests, staff dispatch and the management dashboard.",
    alternates: { canonical: "/contact" },
}

const AGENDA = [
    {
        icon: CalendarClock,
        title: "30 minutes, no slide deck",
        body: "A live walkthrough of the resident app, the staff dispatch flow and the management dashboard.",
    },
    {
        icon: ShieldCheck,
        title: "Your camp, your structure",
        body: "We shape the demo around your blocks, departments and services so you see your own operation, not a generic one.",
    },
    {
        icon: Clock,
        title: "A straight answer on timelines",
        body: "What setup involves, what your team needs to do, and how quickly you could be live.",
    },
]

export default function ContactPage() {
    return (
        <div className="aurora relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
            <div className="pointer-events-none absolute inset-0 grid-lines" aria-hidden="true" />

            <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
                <Reveal>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Back to home
                    </Link>
                </Reveal>

                <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
                    {/* Left: what to expect */}
                    <div>
                        <Reveal>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                                Book a demo
                            </p>
                        </Reveal>
                        <Reveal delay={70}>
                            <h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-tighter sm:text-5xl">
                                See CAMPNAV on{" "}
                                <span className="text-gradient">your camp</span>
                            </h1>
                        </Reveal>
                        <Reveal delay={140}>
                            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
                                Tell us a little about your site and we will set up a walkthrough that
                                reflects how you actually run it. {CONTACT.responsePromise}
                            </p>
                        </Reveal>

                        <div className="mt-10 space-y-6">
                            {AGENDA.map((item, index) => (
                                <Reveal key={item.title} delay={200 + index * 90}>
                                    <div className="flex gap-4">
                                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl tile-3d text-primary">
                                            <item.icon className="size-5" />
                                        </span>
                                        <div>
                                            <h2 className="text-base font-bold tracking-tight">{item.title}</h2>
                                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                                {item.body}
                                            </p>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>

                        <Reveal delay={500}>
                            <div className="mt-10 rounded-2xl border bg-card/60 p-5 backdrop-blur-sm">
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                                    Prefer to reach us directly?
                                </p>
                                <ul className="mt-3 space-y-2.5 text-sm">
                                    <li className="flex items-center gap-2.5">
                                        <Mail className="size-4 shrink-0 text-primary" />
                                        <a className="font-medium hover:text-primary" href={`mailto:${CONTACT.email}`}>
                                            {CONTACT.email}
                                        </a>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Phone className="size-4 shrink-0 text-primary" />
                                        <a
                                            className="font-medium hover:text-primary"
                                            href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
                                        >
                                            {CONTACT.phone}
                                        </a>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <MapPin className="size-4 shrink-0 text-primary" />
                                        <span className="font-medium">{CONTACT.location}</span>
                                    </li>
                                </ul>
                            </div>
                        </Reveal>

                        <Reveal delay={560}>
                            <p className="mt-6 text-sm text-muted-foreground">
                                Already a CAMPNAV camp?{" "}
                                <Link href="/campnav/login" className="font-semibold text-primary hover:underline">
                                    Log in here
                                </Link>
                                .
                            </p>
                        </Reveal>
                    </div>

                    {/* Right: the form */}
                    <Reveal delay={200}>
                        <DemoForm />
                    </Reveal>
                </div>
            </div>
        </div>
    )
}
