import { Reveal } from "@/components/marketing/reveal"
import { cn } from "@/lib/utils"

export function SectionHeading({
    eyebrow,
    title,
    accent,
    body,
    align = "center",
    className,
}: {
    eyebrow: string
    title: string
    accent?: string
    body?: string
    align?: "center" | "left"
    className?: string
}) {
    return (
        <div
            className={cn(
                "max-w-2xl",
                align === "center" && "mx-auto text-center",
                className
            )}
        >
            <Reveal>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                    {eyebrow}
                </p>
            </Reveal>
            <Reveal delay={70}>
                <h2 className="mt-3 text-3xl font-black tracking-tighter sm:text-4xl md:text-[2.75rem] md:leading-[1.08]">
                    {title}
                    {accent ? <span className="text-gradient"> {accent}</span> : null}
                </h2>
            </Reveal>
            {body ? (
                <Reveal delay={140}>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">{body}</p>
                </Reveal>
            ) : null}
        </div>
    )
}
