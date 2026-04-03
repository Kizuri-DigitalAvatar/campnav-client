"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, ShoppingCart, Info, FileText, ChevronRight, Loader2, Home, ExternalLink, Trash2 } from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { isAdmin } from "@/components/role-guard"
import { Id } from "../../../convex/_generated/dataModel"

export default function RoomServicePage() {
  const { user } = useAuth()
  const products = useQuery(api.products.list, {})
  const menus = useQuery(api.menus.list, {})
  const [cart, setCart] = useState<{ id: Id<"products">; count: number }[]>([])
  const [activeTab, setActiveTab] = useState<"menu" | "order">("menu")
  const roomNumber = user?.roomNumber || ""
  const [showRoomNumberModal, setShowRoomNumberModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestMenu, setRequestMenu] = useState<any>(null)
  const [requestNote, setRequestNote] = useState("")
  const [isRequesting, setIsRequesting] = useState(false)
  const [inlineMenu, setInlineMenu] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<Id<"menus"> | null>(null)

  const createOrder = useMutation(api.orders.create)
  const removeMenu = useMutation(api.menus.remove)

  const activeMenus = useMemo(() => {
    if (!menus) return []
    const now = Date.now()
    const isSameDay = (t: number) => {
      const d = new Date(t)
      const today = new Date()
      return d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
    }
    const isWithinWeek = (t: number) => now - t <= 7 * 24 * 60 * 60 * 1000
    return menus.filter((m: any) => {
      if (m.schedule === "daily") return isSameDay(m.uploadedAt)
      if (m.schedule === "weekly") return isWithinWeek(m.uploadedAt)
      return true
    })
  }, [menus])

  const handleOrder = async () => {
    if (!user || !roomNumber.trim() || cart.length === 0) return

    setIsSubmitting(true)
    try {
      const summary = cart
        .map((item) => {
          const product = products?.find((p) => p._id === item.id)
          return `${product?.name} x${item.count}`
        })
        .join(", ")

      await createOrder({
        userId: user._id,
        source: "room_service",
        roomNumber: roomNumber.trim(),
        summary: summary,
        total: cart.reduce((sum, item) => {
          const p = products?.find((p) => p._id === item.id)
          return sum + (p?.price || 0) * item.count
        }, 0),
      })

      setCart([])
      alert("Order placed successfully!")
    } catch (err) {
      console.error(err)
      alert("Failed to place order.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-20 md:max-w-2xl md:mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/services" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Services</span>
          </Link>
          <span>/</span>
          <span>Room Service</span>
        </div>
        <h1 className="text-xl font-semibold text-primary font-black uppercase tracking-tighter italic">Room Service</h1>
        <p className="text-xs text-muted-foreground">Premium dining delivered to your room.</p>
      </header>

      {/* Modern Tabs */}
      <div className="flex p-1.5 bg-muted/40 backdrop-blur-md rounded-2xl gap-1.5 border">
        <button 
          onClick={() => setActiveTab("menu")}
          className={`flex-1 py-2.5 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all duration-300 ${
            activeTab === "menu" 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          View Menus
        </button>
        <button 
          onClick={() => setActiveTab("order")}
          className={`flex-1 py-2.5 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all duration-300 ${
            activeTab === "order" 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          Order From Shop
        </button>
      </div>

      {activeTab === "menu" ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
           {!menus ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="h-44 bg-muted/50 rounded-[2.5rem] animate-pulse border border-muted/50" />
              ))}
            </div>
          ) : activeMenus.length === 0 ? (
            <Card className="p-12 text-center border-dashed rounded-[3rem] bg-muted/10 border-2">
              <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-xs font-medium text-muted-foreground">No digital menus available yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {activeMenus.map((menu) => (
                <div 
                  key={menu._id}
                  className="group relative overflow-hidden rounded-[2.5rem] border-2 bg-gradient-to-br from-card to-muted/20 hover:border-primary/50 transition-all duration-500 shadow-xl shadow-primary/5 active:scale-[0.98]"
                >
                  {user && isAdmin(user.role) && (
                    <button
                      aria-label="Delete menu"
                      className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/90 border text-muted-foreground hover:text-destructive hover:border-destructive/60 hover:bg-destructive/5 transition-colors flex items-center justify-center shadow-sm"
                      onClick={async () => {
                        if (!confirm(`Delete menu “${menu.name}”?`)) return
                        setDeletingId(menu._id)
                        try {
                          await removeMenu({ id: menu._id })
                        } catch (err) {
                          console.error(err)
                          alert("Failed to delete menu.")
                        } finally {
                          setDeletingId(null)
                        }
                      }}
                      disabled={deletingId === menu._id}
                    >
                      {deletingId === menu._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <button
                    className="aspect-[4/3] flex flex-col items-center justify-center p-8 text-center w-full hover:bg-muted/30 transition-colors"
                    onClick={() => {
                      if (menu.type === "text") {
                        setInlineMenu(menu)
                      } else if (menu.url) {
                        window.open(menu.url, "_blank")
                      }
                    }}
                  >
                    <div className="h-24 w-24 rounded-[1.5rem] overflow-hidden bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
                      {menu.type?.startsWith("image") && menu.url ? (
                        <img src={menu.url} alt={menu.name} className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="h-7 w-7" />
                      )}
                    </div>
                    <h3 className="text-sm font-black tracking-tight mb-2 uppercase italic">{menu.name}</h3>
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest rounded-full px-3 py-0.5 border-primary/20 text-primary/70">{menu.category}</Badge>
                  </button>
                  <div className="p-4 border-t bg-muted/30 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                    {menu.type === "text" ? (
                      <details className="w-full">
                        <summary className="flex items-center justify-center gap-2 cursor-pointer text-primary">
                          View Inline <ChevronRight className="h-3 w-3" />
                        </summary>
                        <div className="mt-2 text-left text-xs text-muted-foreground whitespace-pre-wrap bg-background/60 p-3 rounded-xl border">
                          {menu.content || "No content"}
                        </div>
                      </details>
                    ) : (
                      <a 
                        href={menu.url || "#"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-primary hover:underline"
                      >
                        Open Menu <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="p-4 border-t bg-background flex items-center justify-center">
                    <button
                      onClick={() => {
                        if (!roomNumber.trim()) {
                          setShowRoomNumberModal(true)
                          return
                        }
                        setRequestMenu(menu)
                        setRequestNote(menu.type === "text" ? menu.name : "")
                      }}
                      className="h-10 px-4 w-full rounded-xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                    >
                      Request Room Service
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="bg-primary/5 rounded-[2rem] p-6 border-2 border-primary/10 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <ShoppingCart size={80} className="text-primary" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 text-primary">
              <Info className="h-4 w-4" />
              Quick Assistance
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
              Prefer speaking with our team? Call extension <span className="font-black text-primary text-sm">888</span> from your room phone for immediate assistance.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed font-medium">
            Review your selection and checkout. We'll deliver to your room shortly.
          </p>

          {!products ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted/50 rounded-3xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {products.filter(p => p.isAvailable).map((item) => (
                <Card 
                  key={item._id} 
                  className="overflow-hidden rounded-[2rem] border-2 hover:border-primary/30 transition-all duration-300 group cursor-pointer"
                  onClick={() => setSelectedProduct(item)}
                >
                  <div className="flex items-center p-3 gap-4">
                    <div className="h-24 w-24 rounded-2xl bg-muted overflow-hidden flex-shrink-0 border">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                          <ShoppingCart className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="text-sm font-black uppercase tracking-tight italic">{item.name}</h3>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed font-medium">{item.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-black text-primary italic">Le {item.price.toFixed(2)}</span>
                        
                        <button
                          type="button"
                          disabled={item.stock <= 0}
                          onClick={() => {
                            if (!roomNumber.trim()) {
                               setShowRoomNumberModal(true)
                               return
                            }
                            setCart(prev => {
                              const existing = prev.find(i => i.id === item._id)
                              if (existing) return prev.map(i => i.id === item._id ? { ...i, count: i.count + 1 } : i)
                              return [...prev, { id: item._id, count: 1 }]
                            })
                          }}
                          className="h-8 px-4 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-90"
                        >
                          {item.stock <= 0 ? "OUT OF STOCK" : "ADD TO CART"}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && activeTab === "order" && (
        <div className="fixed bottom-6 left-6 right-6 md:max-w-xl md:mx-auto animate-in slide-in-from-bottom-10 duration-500">
          <button
            onClick={handleOrder}
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground h-16 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-between px-8 shadow-2xl shadow-primary/40 border-t-4 border-white/20 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="bg-white/20 px-3 py-1 rounded-lg text-[10px]">{cart.reduce((a, b) => a + b.count, 0)}</span>
              <span>Checkout Order</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg italic font-black">
                Le {cart.reduce((sum, item) => {
                  const p = products?.find((p) => p._id === item.id)
                  return sum + (p?.price || 0) * item.count
                }, 0).toFixed(2)}
              </span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}
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
                <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                  <ShoppingCart className="h-16 w-16" />
                </div>
              )}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 h-10 w-10 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/40 transition-all active:scale-90"
              >
                <ChevronRight className="h-6 w-6 rotate-180" />
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
                  onClick={() => {
                    if (!roomNumber.trim()) {
                      setShowRoomNumberModal(true)
                      return
                    }
                    setCart(prev => {
                      const existing = prev.find(i => i.id === selectedProduct._id)
                      if (existing) return prev.map(i => i.id === selectedProduct._id ? { ...i, count: i.count + 1 } : i)
                      return [...prev, { id: selectedProduct._id, count: 1 }]
                    })
                    setSelectedProduct(null)
                  }}
                  className="h-14 px-8 rounded-[1.5rem] bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Add to Order
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {/* Room Number Missing Modal */}
      {showRoomNumberModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-sm rounded-[2.5rem] border-4 p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto">
              <Home className="h-10 w-10" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Room Number Missing</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                We need to know where to deliver your delicious order! Please set your room number for a seamless stay.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link 
                href="/settings"
                className="h-14 w-full bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                Go to Settings
              </Link>
              <button 
                onClick={() => setShowRoomNumberModal(false)}
                className="h-14 w-full bg-muted text-muted-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Request Room Service Modal */}
      {requestMenu && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-md rounded-[2.5rem] border-4 p-8 space-y-4 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Room Service Request</p>
                <h3 className="text-lg font-bold">{requestMenu.name}</h3>
              </div>
              <button
                onClick={() => setRequestMenu(null)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Notes (optional)</label>
              <textarea
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                className="w-full rounded-xl border border-border bg-card text-sm p-3 min-h-[120px] focus-visible:ring-2 focus-visible:ring-primary/30"
                placeholder="Add details, time preference, dietary needs..."
              />
            </div>
            <Button
              onClick={async () => {
                if (!user) return
                if (!roomNumber.trim()) {
                  setShowRoomNumberModal(true)
                  return
                }
                setIsRequesting(true)
                try {
                  await createOrder({
                    userId: user._id,
                    source: "room_service",
                    roomNumber: roomNumber.trim(),
                    summary: requestNote?.trim() ? `${requestMenu.name} - ${requestNote.trim()}` : requestMenu.name,
                    total: 0,
                  })
                  alert("Request submitted!")
                  setRequestMenu(null)
                  setRequestNote("")
                } catch (e) {
                  console.error(e)
                  alert("Failed to submit request.")
                } finally {
                  setIsRequesting(false)
                }
              }}
              disabled={isRequesting}
              className="w-full rounded-xl"
            >
              {isRequesting ? "Submitting..." : "Submit Request"}
            </Button>
            </Card>
        </div>
      )}

      {/* Inline Menu Viewer */}
      {inlineMenu && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-xl rounded-[2rem] border-4 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{inlineMenu.name}</h3>
              <button
                onClick={() => setInlineMenu(null)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
            </div>
            <div className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 border border-border rounded-xl p-4 max-h-[60vh] overflow-auto">
              {inlineMenu.content || "No content"}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
