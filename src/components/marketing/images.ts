/**
 * Cloudinary-hosted marketing photography.
 *
 * Source files live in Cloudinary under `campnav/marketing/`. Nothing is stored
 * in `public/` — Cloudinary does the resizing, format negotiation and cropping,
 * so the same master image serves every breakpoint and every aspect ratio.
 *
 * Generation prompts for each slot: `docs/landing-image-prompts.md`.
 */

const CLOUD_NAME = "dntxs8rwc"
const BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`

type CldOptions = {
    /** Delivered width in CSS pixels. Cloudinary handles DPR via `dpr_auto`. */
    width?: number
    /** Aspect ratio to crop to, e.g. "3:4". Omit to keep the master ratio. */
    ratio?: string
    /** Extra raw Cloudinary transformation components. */
    extra?: string[]
}

/**
 * Builds a delivery URL for a marketing image.
 *
 * `f_auto` and `q_auto` are always applied: the 1280×720 PNG masters come down
 * as ~50 KB AVIF/WebP rather than ~1.4 MB. When a `ratio` is given the crop uses
 * `g_auto`, so Cloudinary keeps the subject in frame instead of centre-cutting.
 */
export function marketingImage(slot: string, options: CldOptions = {}): string {
    const { width, ratio, extra = [] } = options

    const transforms = ["f_auto", "q_auto", "dpr_auto"]
    if (ratio) transforms.push("c_fill", `ar_${ratio}`, "g_auto")
    if (width) transforms.push(`w_${width}`)
    transforms.push(...extra)

    return `${BASE}/${transforms.join(",")}/campnav/marketing/${slot}.png`
}

/** Every uploaded slot, with the alt text each one ships with. */
export const MARKETING_IMAGES = {
    heroBackdrop: {
        slot: "hero-backdrop",
        alt: "",
    },
    heroContext: {
        slot: "hero-context",
        alt: "A housekeeping supervisor checking an incoming request on her phone in a camp corridor.",
    },
    afterDispatch: {
        slot: "comparison/after-dispatch",
        alt: "A camp supervisor coordinating the shift from a tablet at an organised operations desk.",
    },
    impactBackdrop: {
        slot: "impact-backdrop",
        alt: "",
    },
    ctaBackdrop: {
        slot: "cta-backdrop",
        alt: "",
    },
    ogCover: {
        slot: "og-cover",
        alt: "A camp supervisor on an external walkway checking the day's requests.",
    },
} as const

/** Module images, keyed to `MODULES[].id` in `content.ts`. */
export const MODULE_IMAGES: Record<string, string> = {
    requests: "modules/requests",
    dispatch: "modules/dispatch",
    reports: "modules/reports",
    updates: "modules/updates",
    // meals, maintenance, hse and occupancy are not generated yet — the
    // explorer falls back to its illustrated preview panel for those.
}

/** Audience card images, keyed to `AUDIENCES[].id` in `content.ts`. */
export const AUDIENCE_IMAGES: Record<string, { slot: string; alt: string }> = {
    residents: {
        slot: "audiences/residents",
        alt: "A camp resident sitting in his room at the end of a shift.",
    },
    staff: {
        slot: "audiences/staff",
        alt: "A maintenance technician on site with her tools.",
    },
    management: {
        slot: "audiences/management",
        alt: "A camp manager looking out over the accommodation blocks at dusk.",
    },
}

/** How-it-works step images, in step order. */
export const STEP_IMAGES = ["steps/step-1", "steps/step-2", "steps/step-3"] as const
