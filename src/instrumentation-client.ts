import { startRouteProgress } from "@/lib/route-progress"

/**
 * Next runs this on the client before hydration.
 *
 * `onRouterTransitionStart` fires at the start of every client-side
 * navigation — `<Link>` clicks, `router.push`/`router.replace`, and browser
 * back/forward — which is the one global signal the progress bar needs.
 * `RouteProgress` handles the completion half.
 */
export function onRouterTransitionStart() {
    startRouteProgress()
}
