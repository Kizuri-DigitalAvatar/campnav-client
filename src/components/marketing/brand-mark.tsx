import Link from "next/link"
import { cn } from "@/lib/utils"
import { CampnavLogo } from "@/components/campnav-logo"

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
            <CampnavLogo
                size={34}
                alt={showWordmark ? "" : "CAMPNAV"}
                priority
                className="transition-transform group-hover:-translate-y-0.5"
            />
            {showWordmark && (
                <span className="text-lg font-black tracking-tight leading-none">
                    CAMP<span className="text-primary">NAV</span>
                </span>
            )}
        </Link>
    )
}
