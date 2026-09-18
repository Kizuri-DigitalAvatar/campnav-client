import Link from "next/link"
import { cn } from "@/lib/utils"

export function BrandMark({
    className,
    href = "/",
    showWordmark = true,
}: {
    className?: string
    href?: string
    showWordmark?: boolean
}) {
    return (
        <Link href={href} className={cn("flex items-center gap-2.5 group", className)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl tile-3d-primary text-primary-foreground text-sm font-extrabold tracking-tight transition-transform group-hover:-translate-y-0.5">
                CN
            </span>
            {showWordmark && (
                <span className="text-lg font-black tracking-tight leading-none">
                    CAMP<span className="text-primary">NAV</span>
                </span>
            )}
        </Link>
    )
}
