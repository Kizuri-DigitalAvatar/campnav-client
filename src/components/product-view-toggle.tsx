"use client"

import { useEffect, useState } from "react"
import { LayoutGrid, List } from "lucide-react"

export type ProductView = "grid" | "list"

// Grid/list preference for a product listing, remembered per browser
export function useProductView(storageKey: string, initial: ProductView = "grid") {
  const [view, setView] = useState<ProductView>(initial)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved === "grid" || saved === "list") setView(saved)
    } catch {}
  }, [storageKey])

  function changeView(next: ProductView) {
    setView(next)
    try { localStorage.setItem(storageKey, next) } catch {}
  }

  return [view, changeView] as const
}

export function ProductViewToggle({ view, onChange }: { view: ProductView; onChange: (view: ProductView) => void }) {
  const options = [
    { value: "grid" as const, label: "Grid view", icon: LayoutGrid },
    { value: "list" as const, label: "List view", icon: List },
  ]
  return (
    <div role="group" aria-label="Product layout" className="flex shrink-0 rounded-full border-2 bg-card p-0.5">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={view === value}
          onClick={() => onChange(value)}
          className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${view === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}
