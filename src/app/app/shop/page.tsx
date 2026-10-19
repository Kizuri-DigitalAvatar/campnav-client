"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, Loader2, Minus, PackageCheck, Plus, ShoppingBag, X } from "lucide-react"
import { toast } from "sonner"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"

import { celebrate, ServiceArt } from "@/components/visuals"
import { useAuth } from "@/components/auth-provider"
import { useMyRoom } from "@/components/my-room"
import {
  Collection, CollectionEmpty, CollectionItem, CollectionToolbar, FilterChips, PageHeader, PageSkeleton,
  SearchField, ViewToggle, focusRing, matches, useViewPreference, type ChipOption, type CollectionView,
} from "@/components/collection"
import { api } from "../../../../convex/_generated/api"

const LOW_STOCK = 5

function buzz() {
  try { navigator.vibrate?.(15) } catch {}
}

// Keep the open product in the address bar so the sheet can be shared or reopened
function setProductParam(id: string | null) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set("product", id)
  else url.searchParams.delete("product")
  window.history.replaceState(null, "", url)
}

export default function ShopPage() {
  const { user } = useAuth()
  const router = useRouter()
  const createOrder = useMutation(api.orders.create)
  const incrementOrder = useMutation(api.orders.incrementShopOrder)
  const { roomNumber } = useMyRoom()

  const [category, setCategory] = useState("all")
  const [query, setQuery] = useState("")
  const [view, setView] = useViewPreference("campnav:shop-view", "grid")
  const [openId, setOpenId] = useState<string | null>(null)
  const [noRoom, setNoRoom] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState<string | null>(null)

  const allProducts = useQuery(api.products.list, { category: "all" })
  const myOrders = useQuery(api.orders.listForUser, user ? { userId: user._id } : "skip")

  // Open a product straight from a link (?product=…), e.g. from search
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("product")
    if (id) setOpenId(id)
  }, [])

  const available = useMemo(() => (allProducts ?? []).filter((p: any) => p.isAvailable), [allProducts])

  // Shop orders still on their way, by product name (how orders are matched today)
  const onTheWay = useMemo(() => {
    const map = new Map<string, any>()
    for (const o of myOrders ?? []) {
      if (o.source === "shop" && (o.status === "pending" || o.status === "in_progress")) map.set(o.summary, o)
    }
    return map
  }, [myOrders])

  if (allProducts === undefined) return <PageSkeleton view={view} />

  const categories = [...new Set(available.map((p: any) => p.category as string))].filter(Boolean).sort()
  const chips: ChipOption<string>[] = [
    { key: "all", label: "All", count: available.length },
    ...categories.map((c) => ({ key: c, label: c, count: available.filter((p: any) => p.category === c).length })),
  ]
  const visible = available
    .filter((p: any) => category === "all" || p.category === category)
    .filter((p: any) => matches(query, p.name, p.description, p.category))

  const openProduct = available.find((p: any) => p._id === openId) ?? null
  const pendingItems = [...onTheWay.values()].reduce((n, o) => n + (o.quantity ?? 1), 0)
  const pendingTotal = [...onTheWay.values()].reduce((n, o) => n + (o.total ?? 0), 0)

  /** Adds `qty` of a product: tops up an order already on its way, or starts a new one. */
  async function order(product: any, qty: number, from: "quick" | "sheet") {
    if (!user) return false
    if (!roomNumber.trim()) {
      setNoRoom(true)
      return false
    }
    buzz()
    setBusyId(product._id)
    try {
      const existing = onTheWay.get(product.name)
      if (existing) {
        const updated = await incrementOrder({ orderId: existing._id, amount: qty, unitPrice: product.price })
        const newQty = updated?.quantity ?? (existing.quantity ?? 1) + qty
        if (from === "sheet") celebrate({ title: "Added to your order", message: `You now have ${newQty} × ${product.name} on the way.`, kind: "shop", duration: 2000 })
        else toast.success(`Added — ${newQty} × ${product.name} on the way`, { action: { label: "View", onClick: () => router.push("/app/history") } })
      } else {
        await createOrder({
          userId: user._id,
          source: "shop",
          roomNumber: roomNumber.trim() || undefined,
          summary: product.name,
          total: product.price * qty,
          quantity: qty,
          items: [{ productId: product._id, name: product.name, quantity: qty, price: product.price }],
        })
        celebrate({ title: "Order placed!", message: `${qty} × ${product.name} is on the way to room ${roomNumber}.`, kind: "shop" })
      }
      setJustAdded(product._id)
      window.setTimeout(() => setJustAdded((id) => (id === product._id ? null : id)), 1600)
      return true
    } catch (err) {
      console.error(err)
      toast.error("Could not place the order", { description: "Please try again." })
      return false
    } finally {
      setBusyId(null)
    }
  }

  function open(id: string | null) {
    setOpenId(id)
    setProductParam(id)
  }

  return (
    <div className="space-y-5 pb-10 md:space-y-6">
      <PageHeader
        art="shop"
        title="Shop"
        subtitle={roomNumber ? `Delivered to room ${roomNumber}` : "Essentials and gear for your stay."}
        back={{ href: "/app/services", label: "Services" }}
        actions={
          <Link href="/app/history" className={`inline-flex h-10 items-center gap-2 rounded-full border bg-card px-4 text-xs font-bold shadow-card hover:border-primary/40 ${focusRing}`}>
            <ShoppingBag className="h-4 w-4 text-primary" aria-hidden /> My orders
            {pendingItems > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">{pendingItems}</span>}
          </Link>
        }
      />

      {chips.length > 2 && <FilterChips label="Categories" options={chips} value={category} onChange={setCategory} />}

      <CollectionToolbar>
        <SearchField value={query} onChange={setQuery} placeholder="Search products" />
        <ViewToggle view={view} onChange={setView} label="Product layout" />
      </CollectionToolbar>

      {visible.length === 0 ? (
        available.length === 0
          ? <CollectionEmpty art="shop" title="The shop is empty right now" hint="Check back soon for new items." />
          : <CollectionEmpty art="search" title="Nothing matches" hint="Try another category or word." onReset={() => { setCategory("all"); setQuery("") }} />
      ) : (
        <Collection view={view} label="Products" gridClassName="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p: any, i: number) => (
            <CollectionItem key={p._id} index={i}>
              <ProductTile
                product={p}
                variant={view}
                inOrder={onTheWay.get(p.name)?.quantity ?? 0}
                busy={busyId === p._id}
                added={justAdded === p._id}
                onOpen={() => open(p._id)}
                onQuickAdd={() => order(p, 1, "quick")}
              />
            </CollectionItem>
          ))}
        </Collection>
      )}

      {/* What's already on its way — one tap to the orders page */}
      {pendingItems > 0 && (
        <div className="sticky bottom-[calc(var(--app-bottom,0px)+0.75rem)] z-20 animate-in fade-in slide-in-from-bottom-4 duration-300 md:bottom-6">
          <Link
            href="/app/history"
            className={`mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-foreground px-4 py-3 text-background shadow-pop transition-transform active:scale-[0.98] ${focusRing}`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/15">
              <PackageCheck className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{pendingItems} item{pendingItems === 1 ? "" : "s"} on the way</span>
              <span className="block text-[11px] opacity-70">Le {pendingTotal.toFixed(2)} · tap to track or confirm</span>
            </span>
            <ChevronRight className="h-5 w-5 opacity-70" aria-hidden />
          </Link>
        </div>
      )}

      {openProduct && (
        <ProductSheet
          product={openProduct}
          inOrder={onTheWay.get(openProduct.name)?.quantity ?? 0}
          busy={busyId === openProduct._id}
          onClose={() => open(null)}
          onOrder={async (qty) => { if (await order(openProduct, qty, "sheet")) open(null) }}
        />
      )}

      {noRoom && <NoRoomDialog onClose={() => setNoRoom(false)} />}
    </div>
  )
}

// ── Product tile ──────────────────────────────────────────────────────────

function ProductTile({ product: p, variant, inOrder, busy, added, onOpen, onQuickAdd }: {
  product: any
  variant: CollectionView
  inOrder: number
  busy: boolean
  added: boolean
  onOpen: () => void
  onQuickAdd: () => void
}) {
  const soldOut = p.stock <= 0
  const low = !soldOut && p.stock <= LOW_STOCK

  const picture = (
    <div className={`relative overflow-hidden bg-muted/40 ${variant === "grid" ? "aspect-square w-full" : "h-20 w-20 shrink-0 rounded-2xl border"}`}>
      {p.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.imageUrl} alt="" loading="lazy" className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${soldOut ? "grayscale" : ""}`} />
      ) : (
        <div className="flex h-full items-center justify-center"><ServiceArt kind="shop" size={variant === "grid" ? 72 : 56} motion="hover" /></div>
      )}
      {inOrder > 0 && (
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
          <PackageCheck className="h-3 w-3" aria-hidden />×{inOrder}
        </span>
      )}
      {soldOut && (
        <span className="absolute inset-0 flex items-center justify-center bg-background/60 text-[11px] font-black uppercase tracking-widest text-destructive">Sold out</span>
      )}
    </div>
  )

  const addButton = (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onQuickAdd() }}
      disabled={soldOut || busy}
      aria-label={soldOut ? `${p.name} is sold out` : `Add one ${p.name} to your order`}
      className={`relative z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-primary-glow transition-all active:scale-90 disabled:opacity-40 disabled:shadow-none ${added ? "bg-emerald-600 text-white" : "bg-primary text-primary-foreground hover:brightness-110"}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : added ? <Check className="h-5 w-5 animate-in zoom-in-50" /> : <Plus className="h-5 w-5" />}
    </button>
  )

  const opener = (
    <button type="button" onClick={onOpen} aria-label={`See ${p.name}, Le ${p.price.toFixed(2)}`} className="absolute inset-0 z-10 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background" />
  )

  if (variant === "list") {
    return (
      <article className="va-trigger glass-card group relative flex items-center gap-3 rounded-2xl p-3 transition-transform active:scale-[0.985]">
        {opener}
        {picture}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-black">{p.name}</h3>
          <p className="line-clamp-1 text-xs text-muted-foreground">{p.description}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-base font-black text-primary">Le {p.price.toFixed(2)}</span>
            {low && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Only {p.stock} left</span>}
          </div>
        </div>
        {addButton}
      </article>
    )
  }

  return (
    <article className="va-trigger glass-card group relative flex h-full flex-col overflow-hidden rounded-3xl transition-transform active:scale-[0.98]">
      {opener}
      {picture}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-black leading-snug">{p.name}</h3>
        {low && <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Only {p.stock} left</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-base font-black text-primary">Le {p.price.toFixed(2)}</span>
          {addButton}
        </div>
      </div>
    </article>
  )
}

// ── Product sheet ─────────────────────────────────────────────────────────

function ProductSheet({ product: p, inOrder, busy, onClose, onOrder }: {
  product: any
  inOrder: number
  busy: boolean
  onClose: () => void
  onOrder: (qty: number) => void
}) {
  const [qty, setQty] = useState(1)
  const soldOut = p.stock <= 0
  const max = Math.max(1, Math.min(p.stock || 1, 20))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={p.name}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-card shadow-pop animate-in slide-in-from-bottom-8 duration-300 sm:rounded-[2rem] sm:zoom-in-95 sm:slide-in-from-bottom-2"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/40 sm:aspect-video">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center"><ServiceArt kind="shop" size={120} motion="ambient" /></div>
          )}
          <div className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-background/70 sm:hidden" aria-hidden />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-all hover:bg-black/50 active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="space-y-1.5">
            {p.category && <span className="inline-block rounded-full border border-primary/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">{p.category}</span>}
            <h2 className="text-2xl font-black tracking-tight">{p.name}</h2>
            <p className="text-xl font-black text-primary">Le {p.price.toFixed(2)}</p>
          </div>
          {p.description && <p className="text-sm leading-relaxed text-muted-foreground">{p.description}</p>}

          {inOrder > 0 && (
            <p className="flex items-center gap-2 rounded-2xl bg-primary/8 px-3 py-2.5 text-xs font-semibold text-primary">
              <PackageCheck className="h-4 w-4 shrink-0" />
              You already have {inOrder} on the way — this adds to that order.
            </p>
          )}

          {soldOut ? (
            <p className="rounded-2xl bg-destructive/10 py-4 text-center text-sm font-bold text-destructive">Sold out for now</p>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-2xl border bg-muted/40 p-1" role="group" aria-label="Quantity">
                <button type="button" onClick={() => { buzz(); setQty((q) => Math.max(1, q - 1)) }} disabled={qty <= 1} aria-label="One less" className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-background disabled:opacity-30 active:scale-90">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-9 text-center text-lg font-black tabular-nums" aria-live="polite">{qty}</span>
                <button type="button" onClick={() => { buzz(); setQty((q) => Math.min(max, q + 1)) }} disabled={qty >= max} aria-label="One more" className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-background disabled:opacity-30 active:scale-90">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onOrder(qty)}
                disabled={busy}
                className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground shadow-primary-glow transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                Order · Le {(p.price * qty).toFixed(2)}
              </button>
            </div>
          )}
          {!soldOut && p.stock <= LOW_STOCK && <p className="text-center text-xs font-semibold text-amber-600 dark:text-amber-400">Only {p.stock} left in stock</p>}
        </div>
      </div>
    </div>
  )
}

function NoRoomDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div role="alertdialog" aria-modal="true" aria-labelledby="no-room-title" className="relative w-full max-w-sm space-y-5 rounded-[2rem] border bg-card p-7 text-center shadow-pop animate-in zoom-in-95 duration-300">
        <div className="flex justify-center"><ServiceArt kind="room" size={88} motion="always" /></div>
        <div className="space-y-2">
          <h3 id="no-room-title" className="text-xl font-black tracking-tight">No room yet</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You don&apos;t have a room assigned yet, so we can&apos;t deliver. The camp admin has been notified — you can order as soon as they set your room.
          </p>
        </div>
        <button onClick={onClose} className="h-12 w-full rounded-2xl bg-muted text-xs font-black uppercase tracking-widest transition-all active:scale-95">
          OK
        </button>
      </div>
    </div>
  )
}
