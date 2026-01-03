"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, UtensilsCrossed } from "lucide-react"
import { useMutation, useQuery } from "convex/react"

import { Card } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../convex/_generated/api"

const CATEGORIES = ["Food", "Drink", "Snacks", "Items"] as const
const FILTERS = ["All", "Vegetarian", "High Protein"] as const

type Category = (typeof CATEGORIES)[number]



export default function RoomServicePage() {
  const { user } = useAuth()
  const createOrder = useMutation(api.orders.create)

  const [activeCategory, setActiveCategory] = useState<string>("Food")
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>(
    "All",
  )
  const [roomNumber, setRoomNumber] = useState("")

  const products = useQuery(api.products.list, { category: activeCategory }) ?? []
  const visibleItems = products.filter((p: any) => p.isAvailable)

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
          <span>Room Service</span>
        </div>
        <h1 className="text-xl font-semibold">Order Room Service</h1>
      </header>

      {/* Room Number Input */}
      <div className="space-y-1 text-xs">
        <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Deliver to House/Room
        </label>
        <input
          type="text"
          placeholder="e.g. cabin 101"
          className="h-10 w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
        />
      </div>

      {/* Category tabs */}
      <div className="rounded-full border bg-card px-1 py-1 text-sm">
        <div className="grid grid-cols-4 gap-1">
          {CATEGORIES.map((category) => {
            const selected = category === activeCategory
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={
                  "rounded-full px-2.5 py-1.5 text-center text-xs font-medium transition-colors " +
                  (selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted")
                }
              >
                {category}
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 text-xs">
        {FILTERS.map((filter) => {
          const selected = filter === activeFilter
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={
                "rounded-full border px-3 py-1 transition-colors " +
                (selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground")
              }
            >
              {filter}
            </button>
          )
        })}
      </div>

      {/* Menu cards */}
      <div className="space-y-4">
        {visibleItems.map((item: any) => (
          <Card
            key={item._id}
            className="overflow-hidden rounded-2xl border bg-card/90 p-0 shadow-sm"
          >
            <div className="flex h-40 w-full items-center justify-center bg-muted relative">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
              )}
              {item.stock <= 0 && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-destructive">Sold Out</span>
                </div>
              )}
            </div>
            <div className="space-y-3 border-t px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold leading-snug">
                    {item.name}
                  </h2>
                  <p className="text-xs leading-snug text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary">
                  Le {item.price.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                disabled={!user || item.stock <= 0 || !roomNumber.trim()}
                onClick={async () => {
                  if (!user || !roomNumber.trim()) return
                  await createOrder({
                    userId: user._id,
                    source: "room_service",
                    summary: `${item.name} (Room: ${roomNumber.trim()})`,
                    total: item.price,
                  })
                  alert("Order placed successfully!")
                }}
                className="w-full rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 transition-all transform active:scale-95 shadow-md shadow-primary/20"
              >
                {item.stock <= 0 ? "Sold Out" : "Place order"}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
