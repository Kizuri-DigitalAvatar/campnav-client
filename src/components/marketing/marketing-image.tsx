import { cn } from "@/lib/utils"
import { marketingImage, marketingImageSrcSet } from "@/components/marketing/images"

/**
 * Renders a Cloudinary-hosted marketing photo.
 *
 * Deliberately a plain `<img>` rather than `next/image`. Cloudinary already
 * does the work `next/image` exists to do — format negotiation (`f_auto`),
 * quality (`q_auto`), resizing and subject-aware cropping — so routing these
 * through Next's optimiser would re-encode an already-optimal image, bill a
 * transform per size on Vercel, and require the Cloudinary host in
 * `images.remotePatterns`. The `srcSet` below gives the browser the same
 * resolution switching `next/image` would have generated.
 *
 * `width`/`height` are the intrinsic ratio only — the element is sized by CSS.
 * They are set so the box reserves its space before the image arrives, which
 * is what keeps these from shifting the layout on a slow camp connection.
 */

/** Candidate widths for a full-bleed backdrop. */
export const BACKDROP_WIDTHS = [768, 1280, 1920, 2560] as const

/** Candidate widths for an image sitting inside a card or panel. */
export const CARD_WIDTHS = [320, 480, 768, 1024] as const

type MarketingImageProps = {
    /** Slot path under `campnav/marketing/`, from the manifest in `images.ts`. */
    slot: string
    /** Empty string marks the image as decorative and hides it from screen readers. */
    alt: string
    /** Aspect ratio to crop to, e.g. "3:4". Omit to keep the master ratio. */
    ratio?: string
    /** Standard `sizes` attribute — how wide the image renders at each breakpoint. */
    sizes: string
    widths?: readonly number[]
    /** Fetch immediately instead of lazily. Only for images above the fold. */
    priority?: boolean
    className?: string
}

export function MarketingImage({
    slot,
    alt,
    ratio,
    sizes,
    widths = CARD_WIDTHS,
    priority = false,
    className,
}: MarketingImageProps) {
    const [w, h] = ratio ? ratio.split(":").map(Number) : [16, 9]
    const decorative = alt === ""

    return (
        // eslint-disable-next-line @next/next/no-img-element -- see note above
        <img
            src={marketingImage(slot, { width: widths[widths.length - 1], ratio })}
            srcSet={marketingImageSrcSet(slot, { widths, ratio })}
            sizes={sizes}
            alt={alt}
            aria-hidden={decorative || undefined}
            width={w}
            height={h}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            className={cn("block h-full w-full object-cover", className)}
        />
    )
}
