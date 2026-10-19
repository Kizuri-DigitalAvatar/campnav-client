"use client"

// Product listings use the shared collection view switch so every grid/list
// toggle in the app looks and behaves the same.
import { ViewToggle, useViewPreference, type CollectionView } from "@/components/collection"

export type ProductView = CollectionView

export function useProductView(storageKey: string, initial: ProductView | "auto" = "grid") {
  return useViewPreference<ProductView>(storageKey, initial)
}

export function ProductViewToggle({ view, onChange }: { view: ProductView; onChange: (view: ProductView) => void }) {
  return <ViewToggle view={view} onChange={onChange} label="Product layout" />
}
