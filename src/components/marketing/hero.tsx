import Link from "next/link"
import { ArrowRight, Check, LogIn, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeviceMock } from "@/components/marketing/device-mock"
import { Reveal } from "@/components/marketing/reveal"
import { HERO } from "@/components/marketing/content"

export function Hero() {
    return (
        <section className="aurora relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
            <div className="pointer-events-none absolute inset-0 grid-lines" aria-hidden="true" />

            <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-4 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
                <div>
                    <Reveal>
                        <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary backdrop-blur">
                            <Sparkles className="size-3" />
                            {HERO.eyebrow}
                        </span>
                    </Reveal>

                    <Reveal delay={80}>
                        <h1 className="mt-5 text-[2.6rem] font-black leading-[1.03] tracking-tighter sm:text-6xl lg:text-[4.1rem]">
                            {HERO.title}{" "}
                            <span className="text-gradient">{HERO.titleAccent}</span>
                        </h1>
                    </Reveal>

                    <Reveal delay={150}>
                        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                            {HERO.subtitle}
                        </p>
                    </Reveal>

                    <Reveal delay={220}>
                        <ul className="mt-7 space-y-2.5">
                            {HERO.bullets.map((bullet) => (
                                <li key={bullet} className="flex items-start gap-2.5 text-sm font-medium">
                                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                                        <Check className="size-3" strokeWidth={3} />
                                    </span>
                                    {bullet}
                                </li>
                            ))}
                        </ul>
                    </Reveal>

                    <Reveal delay={300}>
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
                                <Link href="/contact">
                                    Book a demo
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-7 text-base">
                                <Link href="/login">
                                    <LogIn className="size-4" />
                                    Log in
                                </Link>
                            </Button>
                        </div>
                    </Reveal>

                    <Reveal delay={360}>
                        <p className="mt-5 text-xs text-muted-foreground">
                            30-minute walkthrough · no obligation · we reply within one business day
                        </p>
                    </Reveal>
                </div>

                <Reveal delay={200} className="lg:pl-6">
                    <DeviceMock />
                </Reveal>
            </div>
        </section>
    )
}
