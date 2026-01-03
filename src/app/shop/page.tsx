"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Filter, Search } from "lucide-react"
import { useMutation, useQuery } from "convex/react"

import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../convex/_generated/api"

const CATEGORY_FILTERS = ["all", "Food", "Drink", "Snacks", "Gear", "Apparel", "Items", "Service"] as const

type CategoryFilter = (typeof CATEGORY_FILTERS)[number]



export default function ShopPage() {
  const { user } = useAuth()
  const createOrder = useMutation(api.orders.create)

  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [query, setQuery] = useState("")
  const [roomNumber, setRoomNumber] = useState("")

  const products = useQuery(api.products.list, { category: activeFilter }) ?? []

  const visibleProducts = products.filter((product: any) => {
    if (!product.isAvailable) return false
    const matchesQuery =
      !query.trim() ||
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase())
    return matchesQuery
  })

  return (
    <div className="space-y-6 pb-4">
      {/* Breadcrumb + heading */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/services" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Services</span>
          </Link>
          <span>/</span>
          <span>Shop</span>
        </div>
        <h1 className="text-xl font-semibold">Shop</h1>
      </header>

      {/* Search + filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-full border bg-card px-3 py-1 text-sm flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 whitespace-nowrap overflow-hidden"
            />
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-card"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* Room Number for Delivery */}
        <div className="space-y-1 text-xs">
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Deliver to House/Room
          </label>
          <input
            type="text"
            placeholder="e.g. cabin 101"
            className="h-9 w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 text-xs">
        {CATEGORY_FILTERS.map((filter) => {
          const selected = filter === activeFilter
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={
                "rounded-full border px-3 py-1 transition-colors capitalize " +
                (selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground")
              }
            >
              {filter === "all" ? "All" : filter}
            </button>
          )
        })}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-4">
        {visibleProducts.map((product) => (
          <Card
            key={product._id}
            className="flex flex-col overflow-hidden rounded-2xl border bg-card/90 p-0 shadow-sm"
          >
            <div className="flex h-32 w-full items-center justify-center bg-muted relative">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-medium text-muted-foreground">
                  Product Image
                </span>
              )}
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-destructive">Out of Stock</span>
                </div>
              )}
            </div>
            <div className="space-y-2 border-t px-3 py-2 flex flex-col flex-1">
              <h2 className="text-xs font-semibold leading-snug">
                {product.name}
              </h2>
              <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground flex-1">
                {product.description}
              </p>
              <p className="pt-1 text-sm font-semibold text-primary">
                Le {product.price.toFixed(2)}
              </p>
              <button
                type="button"
                disabled={!user || product.stock <= 0 || !roomNumber.trim()}
                onClick={async () => {
                  if (!user || !roomNumber.trim()) return
                  await createOrder({
                    userId: user._id,
                    source: "shop",
                    summary: `${product.name} (Room: ${roomNumber.trim()})`,
                    total: product.price,
                  })
                  alert("Order placed successfully!")
                }}
                className="w-full rounded-full bg-primary py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-50 mt-1 transition-all transform active:scale-95 shadow-md shadow-primary/20"
              >
                {product.stock <= 0 ? "Out of stock" : "Add to order"}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
