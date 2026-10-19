"use client"

import { useCallback, useSyncExternalStore, type ElementType } from "react"
import { LayoutGrid, List } from "lucide-react"

export type CollectionView = "grid" | "list"

const EVENT = "campnav:view-pref"
const PHONE_QUERY = "(max-width: 767px)"

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

function read(key: string) {
  try { return localStorage.getItem(key) } catch { return null }
}

/**
 * Grid/list (or any other named view) remembered per page in this browser.
 * With no saved choice, `fallback: "auto"` shows a list on phones — quicker
 * to scan one-handed — and a grid on wider screens.
 */
export function useViewPreference<T extends string = CollectionView>(
  storageKey: string,
  fallback: T | "auto" = "auto",
  allowed: readonly T[] = ["grid", "list"] as unknown as readonly T[],
) {
  const resolveFallback = useCallback((): T => {
    if (fallback !== "auto") return fallback
    const phone = typeof window !== "undefined" && window.matchMedia?.(PHONE_QUERY).matches
    return (phone ? "list" : "grid") as T
  }, [fallback])

  const view = useSyncExternalStore(
    subscribe,
    () => {
      const saved = read(storageKey)
      return saved && (allowed as readonly string[]).includes(saved) ? (saved as T) : resolveFallback()
    },
    () => (fallback === "auto" ? "grid" : fallback) as T,
  )

  const setView = useCallback((next: T) => {
    try { localStorage.setItem(storageKey, next) } catch {}
    window.dispatchEvent(new Event(EVENT))
  }, [storageKey])

  return [view, setView] as const
}

export interface ViewOption<T extends string> {
  value: T
  label: string
  icon: ElementType
}

export const GRID_LIST: ViewOption<CollectionView>[] = [
  { value: "grid", label: "Grid view", icon: LayoutGrid },
  { value: "list", label: "List view", icon: List },
]

/** Segmented icon switch; the active option sits on a sliding pill. */
export function ViewToggle<T extends string = CollectionView>({
  view,
  onChange,
  options = GRID_LIST as unknown as ViewOption<T>[],
  label = "Layout",
}: {
  view: T
  onChange: (view: T) => void
  options?: ViewOption<T>[]
  label?: string
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === view))
  return (
    <div role="group" aria-label={label} className="relative flex shrink-0 rounded-full border bg-card p-1 shadow-card">
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 w-10 rounded-full bg-primary shadow-primary-glow transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(${index * 2.5}rem)` }}
      />
      {options.map(({ value, label: optionLabel, icon: Icon }) => {
        const active = value === view
        return (
          <button
            key={value}
            type="button"
            aria-label={optionLabel}
            aria-pressed={active}
            title={optionLabel}
            onClick={() => onChange(value)}
            className={`relative z-10 flex h-9 w-10 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
