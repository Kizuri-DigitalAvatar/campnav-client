"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { FAQS } from "@/components/marketing/content"
import { cn } from "@/lib/utils"

export function Faq() {
    const [open, setOpen] = useState<number | null>(0)

    return (
        <div className="mx-auto mt-12 max-w-3xl divide-y rounded-3xl border bg-card/60 px-2 shadow-card backdrop-blur-sm">
            {FAQS.map((item, index) => {
                const expanded = open === index

                return (
                    <div key={item.q}>
                        <h3>
                            <button
                                type="button"
                                onClick={() => setOpen(expanded ? null : index)}
                                aria-expanded={expanded}
                                aria-controls={`faq-panel-${index}`}
                                id={`faq-button-${index}`}
                                className="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-5 text-left outline-none transition-colors hover:text-primary focus-visible:ring-4 focus-visible:ring-ring/25 sm:px-6"
                            >
                                <span className="text-base font-bold tracking-tight sm:text-lg">{item.q}</span>
                                <span
                                    className={cn(
                                        "flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                                        expanded
                                            ? "rotate-45 border-primary/40 bg-primary/10 text-primary"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <Plus className="size-4" />
                                </span>
                            </button>
                        </h3>

                        <div
                            id={`faq-panel-${index}`}
                            role="region"
                            aria-labelledby={`faq-button-${index}`}
                            hidden={!expanded}
                            className="px-4 pb-6 sm:px-6"
                        >
                            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                                {item.a}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
