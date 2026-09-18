import type { Metadata } from "next"
import { Hero } from "@/components/marketing/hero"
import { ModuleExplorer } from "@/components/marketing/module-explorer"
import { Comparison } from "@/components/marketing/comparison"
import { ImpactBand } from "@/components/marketing/impact-band"
import { Faq } from "@/components/marketing/faq"
import { Audiences, CtaBand, HowItWorks } from "@/components/marketing/sections"
import { SectionHeading } from "@/components/marketing/section-heading"

export const metadata: Metadata = {
    title: "CAMPNAV — Camp operations in one place",
    description:
        "CAMPNAV connects residents, staff and management on one platform: service requests, staff dispatch, meals, maintenance, HSE reporting and live occupancy. Book a demo.",
    alternates: { canonical: "/" },
}

export default function LandingPage() {
    return (
        <>
            <Hero />

            {/* Platform — the case for moving off radio and paper */}
            <section id="platform" className="scroll-mt-24 border-y bg-card/30 py-20 md:py-28">
                <div className="mx-auto w-full max-w-6xl px-4">
                    <SectionHeading
                        eyebrow="The platform"
                        title="Camps don't fail on effort."
                        accent="They fail on coordination."
                        body="Every camp already has people willing to do the work. What goes missing is the thread connecting a request to the person who can close it — and the record proving it happened."
                    />
                    <Comparison />
                </div>
            </section>

            {/* Modules */}
            <section id="modules" className="scroll-mt-24 py-20 md:py-28">
                <div className="mx-auto w-full max-w-6xl px-4">
                    <SectionHeading
                        eyebrow="Modules"
                        title="Everything the camp runs on,"
                        accent="in one platform"
                        body="Pick a module to see what your team would actually be looking at."
                    />
                    <div className="mt-14">
                        <ModuleExplorer />
                    </div>
                </div>
            </section>

            <HowItWorks />
            <Audiences />
            <ImpactBand />

            {/* FAQ */}
            <section id="faq" className="scroll-mt-24 border-t py-20 md:py-28">
                <div className="mx-auto w-full max-w-6xl px-4">
                    <SectionHeading
                        eyebrow="Questions"
                        title="The things camp managers"
                        accent="ask us first"
                    />
                    <Faq />
                </div>
            </section>

            <CtaBand />
        </>
    )
}
