import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * The CAMPNAV mark. The artwork carries its own colour and silhouette, so it is
 * rendered on transparency rather than inside a coloured tile — dropping the
 * blue logo onto the blue primary tile would swallow half of it.
 *
 * Pass alt="" where a visible CAMPNAV wordmark already names the brand.
 */
export function CampnavLogo({
    size = 36,
    className,
    alt = "CAMPNAV",
    priority = false,
}: {
    size?: number
    className?: string
    alt?: string
    priority?: boolean
}) {
    return (
        <Image
            src="/campnav-logo.png"
            alt={alt}
            width={size}
            height={size}
            priority={priority}
            className={cn("object-contain select-none", className)}
            style={{ width: size, height: size }}
        />
    )
}
