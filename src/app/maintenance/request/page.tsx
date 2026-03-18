"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { ArrowLeft, X, Upload } from "lucide-react"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../../convex/_generated/api"

const CATEGORIES = ["Plumbing", "Electrical", "General Repairs", "Other"] as const
type Category = (typeof CATEGORIES)[number]

const SUB_CATEGORIES: Record<Category, string[]> = {
  Plumbing: ["Taps/Faucets", "Toilet", "Pipes/Leaks", "Hot Water", "Other"],
  Electrical: ["Light Bulbs", "Sockets & Switches", "Appliances", "Wiring Fault", "Other"],
  "General Repairs": ["Doors/Locks", "Windows", "Furniture", "Walls/Ceiling", "Other"],
  Other: ["Other (please specify)"],
}

export default function MaintenanceRequestPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [category, setCategory] = useState<Category>("Plumbing")
  const [subCategory, setSubCategory] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  const [description, setDescription] = useState("")
  const [applianceModel, setApplianceModel] = useState("")
  const [accessPreference, setAccessPreference] = useState<"allow_entry" | "must_be_present">("allow_entry")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const createRequest = useMutation(api.requests.create)
  const generateUploadUrl = useMutation(api.images.generateUploadUrl)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !roomNumber.trim() || !description.trim() || !category) return

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
        type: "maintenance",
        roomNumber: roomNumber.trim(),
        description: description.trim(),
        priority: "pending_review", // Admin will set this
        category,
        subCategory,
        applianceModel: applianceModel.trim(),
        accessPreference,
        image: storageId,
      })

      router.push("/requests")
    } catch (err) {
      console.error("Failed to submit maintenance request:", err)
      alert("Error submitting request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-4 md:max-w-xl md:mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/maintenance" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Maintenance</span>
          </Link>
          <span>/</span>
          <span>Request</span>
        </div>
        <h1 className="text-xl font-semibold">Submit a Request</h1>
        <p className="text-xs text-muted-foreground">
          Fill out the form below to report an issue. Our team will get back to you
          shortly.
        </p>
      </header>

      <Card className="space-y-4 rounded-2xl border bg-card/90 p-4 shadow-sm">
        <div className="space-y-1 text-xs">
          <label className="block text-[11px] font-medium text-muted-foreground">
            House/Room Number
          </label>
          <Input
            placeholder="e.g. cabin 101"
            className="h-10 rounded-xl"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          />
        </div>

        <div className="space-y-2 text-xs">
          <p className="text-[11px] font-medium text-muted-foreground">Category</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((value) => {
              const selected = value === category
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setCategory(value)
                    setSubCategory("") // Reset sub-category on change
                  }}
                  className={
                    "rounded-xl border px-3 py-2 text-[11px] font-medium transition-colors text-center " +
                    (selected
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/50")
                  }
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>

        {category && (
          <div className="space-y-1 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="block text-[11px] font-medium text-muted-foreground">
              What specifically is the issue?
            </label>
            <select
              className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              required
            >
              <option value="" disabled>Select a sub-category...</option>
              {SUB_CATEGORIES[category].map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        )}

        {category === "Electrical" && (
           <div className="space-y-1 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
           <label className="block text-[11px] font-medium text-muted-foreground">
             Model of Appliance (if applicable)
           </label>
           <Input
             placeholder="e.g. LG Fridge AR-200"
             className="h-10 rounded-xl"
             value={applianceModel}
             onChange={(e) => setApplianceModel(e.target.value)}
           />
         </div>
        )}

        <div className="space-y-1 text-xs">
          <label className="block text-[11px] font-medium text-muted-foreground">
            Instruction / Comments
          </label>
          <textarea
            rows={4}
            className="min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none ring-ring/50 focus-visible:border-ring focus-visible:ring-[3px]"
            placeholder="Tell us more about the issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2 text-xs border-t pt-4">
          <p className="text-[11px] font-medium text-muted-foreground">Access to Property</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setAccessPreference("allow_entry")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                accessPreference === "allow_entry" 
                  ? "border-primary bg-primary/10 ring-1 ring-primary" 
                  : "border-border bg-background hover:bg-muted/30"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${accessPreference === "allow_entry" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                {accessPreference === "allow_entry" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-xs text-foreground">Entry Permitted</p>
                <p className="text-[10px] text-muted-foreground leading-tight">The tradesperson can collect keys and attend without me being present</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setAccessPreference("must_be_present")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                accessPreference === "must_be_present" 
                  ? "border-primary bg-primary/10 ring-1 ring-primary" 
                  : "border-border bg-background hover:bg-muted/30"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${accessPreference === "must_be_present" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                {accessPreference === "must_be_present" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-xs text-foreground">Must Be Present</p>
                <p className="text-[10px] text-muted-foreground leading-tight">I wish to be present when the tradesperson attends the property</p>
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-2 text-xs border-t pt-4">
          <p className="text-[11px] font-medium text-muted-foreground">
            Upload a photo (optional)
          </p>
          <div className="flex gap-3">
            {!imagePreview ? (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-input bg-muted/40 text-[11px] text-muted-foreground hover:border-primary/50 transition-colors">
                <Upload className="h-4 w-4 mb-1" />
                <span>+ Add</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="relative h-20 w-20 group">
                <img src={imagePreview} alt="Preview" className="h-full w-full rounded-2xl object-cover" />
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <button
        type="submit"
        disabled={isSubmitting || !user}
        className="flex w-full items-center justify-center rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-[0.98] transition-all"
      >
        {isSubmitting ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  )
}
