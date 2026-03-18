"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ShoppingCart, Info, FileText, ChevronRight, Loader2 } from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { Id } from "../../../convex/_generated/dataModel"

export default function RoomServicePage() {
  const products = useQuery(api.products.list)
  const menus = useQuery(api.menus.list)
  const [cart, setCart] = useState<{ id: Id<"products">; count: number }[]>([])
  const [activeTab, setActiveTab] = useState<"menu" | "order">("menu")
  const [roomNumber, setRoomNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const createRequest = useMutation(api.requests.create)

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

      await createRequest({
        userId: user._id,
        type: "room_service",
        roomNumber: roomNumber.trim(),
        description: `Order: ${summary}`,
        priority: "low",
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
          Order Online
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
          ) : menus.length === 0 ? (
            <Card className="p-12 text-center border-dashed rounded-[3rem] bg-muted/10 border-2">
              <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-xs font-medium text-muted-foreground">No digital menus available yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {menus.map((menu) => (
                <a 
                  key={menu._id}
                  href={menu.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-[2.5rem] border-2 bg-gradient-to-br from-card to-muted/20 hover:border-primary/50 transition-all duration-500 shadow-xl shadow-primary/5 active:scale-[0.98]"
                >
                  <div className="aspect-[4/3] flex flex-col items-center justify-center p-8 text-center">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                      <FileText className="h-7 w-7" />
                    </div>
                    <h3 className="text-sm font-black tracking-tight mb-2 uppercase italic">{menu.name}</h3>
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest rounded-full px-3 py-0.5 border-primary/20 text-primary/70">{menu.category}</Badge>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                      <span>Open Menu</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </a>
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
          <Card className="p-4 rounded-[2rem] border-2 bg-primary/5 border-primary/10">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Room / Cabin Number</label>
              <input
                type="text"
                placeholder="e.g. cabin 204"
                className="h-12 w-full rounded-2xl border-2 bg-background/80 px-4 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              />
            </div>
          </Card>

          {!products ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted/50 rounded-3xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {products.filter(p => p.available).map((item) => (
                <Card key={item._id} className="overflow-hidden rounded-[2rem] border-2 hover:border-primary/30 transition-all duration-300 group">
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
                        <span className="text-sm font-black text-primary italic">${item.price.toFixed(2)}</span>
                        
                        <button
                          type="button"
                          disabled={item.stock <= 0 || !roomNumber.trim()}
                          onClick={() => {
                            if (!roomNumber.trim()) {
                              alert("Please enter your room number first.")
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
                ${cart.reduce((sum, item) => {
                  const p = products?.find((p) => p._id === item.id)
                  return sum + (p?.price || 0) * item.count
                }, 0).toFixed(2)}
              </span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
