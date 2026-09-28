/**
 * Tiny framework-free store backing the top-of-page navigation progress bar.
 *
 * It lives outside React because the *start* signal comes from Next's client
 * instrumentation hook (`src/instrumentation-client.ts`), which runs before
 * hydration and outside any component tree. `RouteProgress` subscribes to it
 * with `useSyncExternalStore` and owns the completion side.
 */

/** Wait this long before showing anything — most navigations beat it. */
const SHOW_DELAY_MS = 140

/** How often the bar creeps forward while a navigation is in flight. */
const TRICKLE_INTERVAL_MS = 300

/** The bar never reaches this on its own; only completion takes it to 1. */
const CEILING = 0.92

/** Give up and hide if a navigation never resolves (failed fetch, offline). */
const STALL_TIMEOUT_MS = 20_000

/** How long the full bar stays visible before fading out. */
const FINISH_LINGER_MS = 220

export type RouteProgressState = {
    /** True once the show delay has elapsed and the bar should be painted. */
    visible: boolean
    /** 0 → 1. Drives the bar's horizontal scale. */
    value: number
}

let state: RouteProgressState = { visible: false, value: 0 }

const listeners = new Set<() => void>()

let showTimer: ReturnType<typeof setTimeout> | null = null
let trickleTimer: ReturnType<typeof setInterval> | null = null
let stallTimer: ReturnType<typeof setTimeout> | null = null
let finishTimer: ReturnType<typeof setTimeout> | null = null

function emit(next: RouteProgressState) {
    state = next
    for (const listener of listeners) listener()
}

function clearTimers() {
    if (showTimer) clearTimeout(showTimer)
    if (trickleTimer) clearInterval(trickleTimer)
    if (stallTimer) clearTimeout(stallTimer)
    if (finishTimer) clearTimeout(finishTimer)
    showTimer = trickleTimer = stallTimer = finishTimer = null
}

/**
 * Advances the bar by a decreasing amount, so it moves quickly at first and
 * crawls as it approaches the ceiling. The point is to read as progress
 * without ever implying the navigation is nearly done.
 */
function trickle() {
    const remaining = CEILING - state.value
    if (remaining <= 0.001) return
    emit({ ...state, value: state.value + remaining * 0.28 })
}

/** Called on every navigation start. Safe to call again mid-navigation. */
export function startRouteProgress() {
    if (typeof window === "undefined") return

    clearTimers()
    emit({ visible: false, value: 0 })

    showTimer = setTimeout(() => {
        emit({ visible: true, value: 0.08 })
        trickleTimer = setInterval(trickle, TRICKLE_INTERVAL_MS)
    }, SHOW_DELAY_MS)

    stallTimer = setTimeout(() => {
        clearTimers()
        emit({ visible: false, value: 0 })
    }, STALL_TIMEOUT_MS)
}

/** Called once the new route has committed. */
export function completeRouteProgress() {
    if (typeof window === "undefined") return

    // Never started, or already finished — nothing to wind down.
    if (!state.visible && showTimer === null) {
        clearTimers()
        return
    }

    const wasVisible = state.visible
    clearTimers()

    // The navigation resolved inside the show delay, so the bar never
    // appeared. Drop it rather than flashing a complete-and-vanish bar.
    if (!wasVisible) {
        emit({ visible: false, value: 0 })
        return
    }

    emit({ visible: true, value: 1 })
    finishTimer = setTimeout(() => {
        emit({ visible: false, value: 0 })
        finishTimer = null
    }, FINISH_LINGER_MS)
}

export function subscribeToRouteProgress(listener: () => void) {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

export function getRouteProgressState() {
    return state
}

/** The bar is client-only; the server always renders it hidden. */
export const ROUTE_PROGRESS_SERVER_STATE: RouteProgressState = {
    visible: false,
    value: 0,
}
