"use client"

import { Suspense, useEffect, useSyncExternalStore } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import {
    ROUTE_PROGRESS_SERVER_STATE,
    completeRouteProgress,
    getRouteProgressState,
    subscribeToRouteProgress,
} from "@/lib/route-progress"

/**
 * Top-of-page navigation progress bar.
 *
 * Navigations *start* it from `src/instrumentation-client.ts` — Next's
 * `onRouterTransitionStart` hook fires for `<Link>` clicks, `router.push`
 * and `router.replace`, and browser back/forward alike, which is why this
 * needs no click interception or history patching.
 *
 * Completion is observed here: when the pathname or query string changes,
 * the new route has committed.
 */
function RouteProgressBar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const { visible, value } = useSyncExternalStore(
        subscribeToRouteProgress,
        getRouteProgressState,
        () => ROUTE_PROGRESS_SERVER_STATE,
    )

    useEffect(() => {
        completeRouteProgress()
    }, [pathname, searchParams])

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
            style={{
                opacity: visible ? 1 : 0,
                // Fade out only after finishing, so the bar does not visibly
                // dim while it is still filling.
                transition: visible ? "none" : "opacity 200ms ease-out",
            }}
        >
            <div
                className="h-full w-full origin-left bg-primary"
                style={{
                    transform: `scaleX(${value})`,
                    transition: "transform 200ms ease-out",
                    boxShadow: "0 0 8px var(--primary), 0 0 3px var(--primary)",
                }}
            />
        </div>
    )
}

/**
 * `useSearchParams` opts its subtree into client rendering, so the bar is
 * wrapped in its own Suspense boundary to keep that contained rather than
 * letting it reach the pages themselves.
 */
export function RouteProgress() {
    return (
        <Suspense fallback={null}>
            <RouteProgressBar />
        </Suspense>
    )
}
