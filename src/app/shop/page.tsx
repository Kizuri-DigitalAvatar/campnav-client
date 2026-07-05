"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, ShoppingBag, ShoppingCart, X, Home } from "lucide-react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"

import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../convex/_generated/api"

const CATEGORY_FILTERS = ["all", "Food", "Drink", "Snacks", "Gear", "Apparel", "Items", "Service"] as const

type CategoryFilter = (typeof CATEGORY_FILTERS)[number]



export default function ShopPage() {
  const { user } = useAuth()
  const createOrder = useMutation(api.orders.create)
  const incrementOrder = useMutation(api.orders.incrementShopOrder)

  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [query, setQuery] = useState("")
  // Manual room number entry, prefilled from the profile when available
  const [roomNumber, setRoomNumber] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRoomNumberModal, setShowRoomNumberModal] = useState(false)
  const [pendingProduct, setPendingProduct] = useState<any>(null)

  useEffect(() => {
    if (user?.roomNumber) setRoomNumber((current) => current || user.roomNumber!)
  }, [user?.roomNumber])

  const products = useQuery(api.products.list, { category: activeFilter }) ?? []
  const myOrders = useQuery(api.orders.listForUser, user ? { userId: user._id } : "skip") ?? []

  const placeShopOrder = async (product: any, room: string) => {
    if (!user) return
    const existing = myOrders.find((o: any) =>
      o.source === "shop" &&
      o.summary === product.name &&
      (o.status === "pending" || o.status === "in_progress")
    )
    if (existing) {
      const updated = await incrementOrder({
        orderId: existing._id,
        amount: 1,
        unitPrice: product.price,
      })
      const newQty = updated?.quantity ?? (existing.quantity ?? 1) + 1
      alert(`Quantity updated to ${newQty}`)
      return
    }
    await createOrder({
      userId: user._id,
      source: "shop",
      roomNumber: room.trim() || undefined,
      summary: product.name,
      total: product.price,
    })
    alert("Order placed successfully!")
  }

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
        <h1 className="text-xl font-semibold text-primary font-black uppercase tracking-tighter italic">Camp Shop</h1>
        <p className="text-xs text-muted-foreground">Order essentials and gear for your stay.</p>
      </header>

      {/* Search + filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-full border-2 bg-card px-4 py-2 text-sm flex items-center gap-2 focus-within:border-primary/50 transition-all">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0 font-bold uppercase tracking-tight"
            />
          </div>
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
            className="flex flex-col h-full rounded-[2.5rem] overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 group cursor-pointer"
            onClick={() => setSelectedProduct(product)}
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
              <div className="flex items-center justify-between mt-auto">
                <span className="text-sm font-black text-primary italic">Le {product.price.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation()
                  if (!user) return
                  if (!roomNumber.trim()) {
                    setPendingProduct(product)
                    setShowRoomNumberModal(true)
                    return
                  }
                  await placeShopOrder(product, roomNumber)
                }}
                className="w-full rounded-full bg-primary py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-50 mt-1 transition-all transform active:scale-95 shadow-md shadow-primary/20"
              >
                {product.stock <= 0 ? "Out of stock" : "Add to order"}
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="absolute inset-0" 
            onClick={() => setSelectedProduct(null)} 
          />
          <Card className="relative w-full max-w-lg overflow-hidden rounded-[3rem] border-4 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="aspect-video w-full bg-muted overflow-hidden relative">
              {selectedProduct.imageUrl ? (
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-full w-full object-cover" />
              ) : (
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 h-10 w-10 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/40 transition-all active:scale-90"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-1 border-primary/20 text-primary">{selectedProduct.category}</Badge>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">{selectedProduct.name}</h2>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                {selectedProduct.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t-2 border-dashed">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Price</span>
                  <span className="text-2xl font-black text-primary italic">Le {selectedProduct.price.toFixed(2)}</span>
                </div>
                
                <button
                  disabled={isSubmitting}
                  onClick={async () => {
                    if (!roomNumber.trim()) {
                      setPendingProduct(selectedProduct)
                      setShowRoomNumberModal(true)
                      return
                    }
                    setIsSubmitting(true)
                    try {
                      await placeShopOrder(selectedProduct, roomNumber)
                      setSelectedProduct(null)
                    } catch (err) {
                      console.error(err)
                      alert("Failed to place order.")
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}
                  className="h-14 px-8 rounded-[1.5rem] bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Order Now
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {/* Room Number Entry Modal */}
      {showRoomNumberModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-sm rounded-[2.5rem] border-4 p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Home className="h-10 w-10" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Where to?</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Enter your room number so we know where to deliver your order.
              </p>
            </div>
            <input
              autoFocus
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. B-204"
              className="w-full h-14 rounded-2xl border border-input bg-card px-4 text-center text-lg font-bold tracking-widest shadow-[inset_0_1px_2px_rgb(16_24_40_/_0.04)] placeholder:text-muted-foreground/50 placeholder:font-medium focus:outline-none focus:border-ring focus:ring-4 focus:ring-ring/15 transition-all"
            />
            <div className="flex flex-col gap-3">
              <button
                disabled={!roomNumber.trim()}
                onClick={async () => {
                  setShowRoomNumberModal(false)
                  const product = pendingProduct
                  setPendingProduct(null)
                  if (product) {
                    try {
                      await placeShopOrder(product, roomNumber)
                      setSelectedProduct(null)
                    } catch (err) {
                      console.error(err)
                      alert("Failed to place order.")
                    }
                  }
                }}
                className="h-14 w-full bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
              >
                Confirm & Order
              </button>
              <button
                onClick={() => { setShowRoomNumberModal(false); setPendingProduct(null) }}
                className="h-14 w-full bg-muted text-muted-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
