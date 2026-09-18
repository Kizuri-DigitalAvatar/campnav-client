import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"
import { BrandMark } from "@/components/marketing/brand-mark"
import { CONTACT } from "@/components/marketing/content"

const COLUMNS = [
    {
        title: "Platform",
        links: [
            { href: "/#platform", label: "Overview" },
            { href: "/#modules", label: "Modules" },
            { href: "/#how-it-works", label: "How it works" },
            { href: "/#impact", label: "Results" },
        ],
    },
    {
        title: "Who it's for",
        links: [
            { href: "/#audiences", label: "Residents & guests" },
            { href: "/#audiences", label: "Camp staff" },
            { href: "/#audiences", label: "Camp management" },
            { href: "/#faq", label: "FAQ" },
        ],
    },
    {
        title: "Get started",
        links: [
            { href: "/contact", label: "Book a demo" },
            { href: "/campnav/login", label: "Log in" },
            { href: `mailto:${CONTACT.email}`, label: "Talk to sales" },
        ],
    },
]

export function SiteFooter() {
    return (
        <footer className="border-t bg-card/40">
            <div className="mx-auto w-full max-w-6xl px-4 py-14 md:py-16">
                <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
                    <div className="space-y-4">
                        <BrandMark />
                        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                            One platform for every camp operation — requests, dispatch, meals,
                            maintenance, safety and occupancy.
                        </p>
                        <ul className="space-y-2 pt-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <Mail className="size-4 shrink-0 text-primary" />
                                <a className="hover:text-foreground" href={`mailto:${CONTACT.email}`}>
                                    {CONTACT.email}
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="size-4 shrink-0 text-primary" />
                                <a className="hover:text-foreground" href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>
                                    {CONTACT.phone}
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <MapPin className="size-4 shrink-0 text-primary" />
                                <span>{CONTACT.location}</span>
                            </li>
                        </ul>
                    </div>

                    {COLUMNS.map((column) => (
                        <div key={column.title} className="space-y-3">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                                {column.title}
                            </p>
                            <ul className="space-y-2.5">
                                {column.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
                    <p>© {new Date().getFullYear()} CAMPNAV. All rights reserved.</p>
                    <p>Built for camps that run around the clock.</p>
                </div>
            </div>
        </footer>
    )
}
