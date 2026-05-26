"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Upload, X, Plus, Minus, Info } from "lucide-react"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"

import { Card } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../convex/_generated/api"

const LAUNDRY_ITEMS = [
  "Shirts", "Pants", "Handkerchiefs", "Undershirt", "Socks, pair", 
  "Undershorts/Briefs", "Bra", "Panties", "Nightgown", 
  "Pajamas - 2 pc.", "Pajamas - silk", "Blouse", "Slip", "Robe",
  "PPE Shirt", "PPE Trousers"
]

const DRY_CLEANING_ITEMS = [
  "Pants/Slacks", "Shirts", "Neck Tie", "Blouse", "Skirts", 
  "Dress", "Sweater", "Suit - 2 pc.", "Suit - 3 pc.", 
  "Jacket", "Sport Coat/Blazer", "Overcoat", "Vest"
]

const STARCH_OPTIONS = ["No Starch", "Light", "Medium", "Heavy"] as const

type ItemSelection = {
  name: string
  quantity: number
  type: "laundry" | "dry_cleaning"
}

export default function LaundryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [roomNumber, setRoomNumber] = useState("")
  const [description, setDescription] = useState("") // Instructions
  const [starch, setStarch] = useState<(typeof STARCH_OPTIONS)[number]>("No Starch")
  const [items, setItems] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Populate room number dynamically from user profile if available, otherwise leave open
  useEffect(() => {
    if (user?.roomNumber && !roomNumber) {
      setRoomNumber(user.roomNumber)
    }
  }, [user?.roomNumber])

  const createRequest = useMutation(api.requests.create)
  const generateUploadUrl = useMutation(api.images.generateUploadUrl)

  const updateQuantity = (itemName: string, delta: number) => {
    setItems(prev => {
      const current = prev[itemName] || 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const { [itemName]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [itemName]: next }
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleSchedule() {
    if (!user || !roomNumber.trim()) return
    const selectedLaundryItems: ItemSelection[] = Object.entries(items).map(([name, quantity]) => ({
      name,
      quantity,
      type: LAUNDRY_ITEMS.includes(name) ? "laundry" : "dry_cleaning"
    }))

    if (selectedLaundryItems.length === 0) {
      alert("Please select at least one item.")
      return
    }

    setIsSubmitting(true)
    let storageId = undefined
    try {
      if (selectedFile) {
        const postUrl = await generateUploadUrl()
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        })
        const data = await result.json()
        storageId = data.storageId
      }

      await createRequest({
        userId: user._id,
        type: "laundry",
        roomNumber: roomNumber.trim(),
        description: description.trim() || "No specific instructions",
        priority: "low",
        image: storageId,
        laundryItems: selectedLaundryItems,
        starch: starch
      })
      
      router.push("/requests")
    } catch (err) {
      console.error(err)
      alert("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSection = (title: string, itemList: string[]) => (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <div className="h-1 w-4 bg-primary rounded-full" />
        {title}
      </h3>
      <div className="space-y-2">
        {itemList.map(item => (
          <div key={item} className="flex items-center justify-between p-3 rounded-2xl border bg-background/50 group transition-all hover:border-primary/30">
            <span className="text-xs font-medium">{item}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateQuantity(item, -1)}
                className={`p-1.5 rounded-lg border transition-all ${items[item] ? "bg-muted text-foreground hover:bg-muted/80" : "opacity-30 cursor-not-allowed"}`}
                disabled={!items[item]}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className={`text-xs font-bold w-4 text-center ${items[item] ? "text-primary" : "text-muted-foreground"}`}>
                {items[item] || 0}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(item, 1)}
                className="p-1.5 rounded-lg border bg-primary/10 text-primary hover:bg-primary/20 transition-all"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 pb-6 md:max-w-2xl md:mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/services" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Services</span>
          </Link>
          <span>/</span>
          <span>Laundry</span>
        </div>
        <h1 className="text-xl font-semibold">Laundry & Dry Cleaning</h1>
        <p className="text-xs text-muted-foreground">Select the items you need cleaned and their quantities.</p>
      </header>

      <Card className="p-4 space-y-6 rounded-3xl border-2 shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm">
        <div className="space-y-1 text-xs">
          <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            House / Room Number
          </label>
          <input
            type="text"
            placeholder="e.g. mackay 102"
            className="h-12 w-full rounded-2xl border border-input bg-background/50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {renderSection("Laundry", LAUNDRY_ITEMS)}
          {renderSection("Dry Cleaning", DRY_CLEANING_ITEMS)}
        </div>

        <div className="space-y-3 border-t pt-6">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Starch Preference</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {STARCH_OPTIONS.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setStarch(option)}
                className={`py-2 px-3 rounded-xl border text-[11px] font-black uppercase transition-all ${
                  starch === option 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 border-t pt-6">
          <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Special Instructions
          </label>
          <textarea
            rows={3}
            className="w-full rounded-2xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] resize-none"
            placeholder="e.g. Hand wash only, extra care for silk items..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-3 border-t pt-6">
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Upload Photo Evidence
          </p>
          <div className="flex gap-3">
            {!imagePreview ? (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-input bg-muted/20 text-[10px] text-muted-foreground hover:border-primary/50 transition-all hover:bg-primary/5">
                <Upload className="h-5 w-5 mb-2" />
                <span className="font-bold">ADD PHOTO</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="relative h-24 w-24 group">
                <img src={imagePreview} alt="Preview" className="h-full w-full rounded-2xl object-cover ring-2 ring-primary/20" />
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex-1 rounded-2xl bg-muted/30 p-3 flex gap-2 items-start">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] leading-snug text-muted-foreground italic">
                Notice: We take care of your garments. Any claim for damage or shortage must be made within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <button
        type="button"
        disabled={isSubmitting || !user}
        onClick={handleSchedule}
        className="flex w-full items-center justify-center rounded-full bg-primary py-4 text-sm font-black uppercase tracking-widest text-primary-foreground shadow-2xl shadow-primary/30 disabled:opacity-50 active:scale-[0.98] transition-all"
      >
        {isSubmitting ? "PROCESSING REQUEST..." : "SUBMIT LAUNDRY LIST"}
      </button>
    </div>
  )
}
