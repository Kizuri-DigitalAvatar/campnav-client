"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Upload, X } from "lucide-react"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"

import { Card } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../convex/_generated/api"

const OPTIONS = ["Wash", "Dry Clean", "Both"] as const

type LaundryOption = (typeof OPTIONS)[number]

export default function LaundryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [option, setOption] = useState<LaundryOption>("Wash")
  const [description, setDescription] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
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

  async function handleSchedule() {
    if (!user || !description.trim() || !roomNumber.trim()) return
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
        description: `${option}: ${description.trim()}`,
        priority: "important",
        image: storageId,
      })
      alert("Laundry scheduled!")
      router.push("/requests")
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-4">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/services" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Services</span>
          </Link>
          <span>/</span>
          <span>Laundry</span>
        </div>
      </header>

      <Card className="space-y-4 rounded-2xl border bg-card/90 p-4 shadow-sm">
        <div className="space-y-1 text-xs">
          <label className="block text-[11px] font-medium text-muted-foreground">
            House/Room Number
          </label>
          <input
            type="text"
            placeholder="e.g. cabin 101"
            className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none ring-ring/50 focus-visible:border-ring focus-visible:ring-[3px]"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          />
        </div>

        <div className="space-y-1 text-xs">
          <p className="text-[11px] font-medium text-muted-foreground">
            What do you need?
          </p>
          <div className="flex flex-wrap gap-2">
            {OPTIONS.map((value) => {
              const selected = value === option
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOption(value)}
                  className={
                    "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors " +
                    (selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground")
                  }
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <label className="block text-[11px] font-medium text-muted-foreground">
            Describe the issue
          </label>
          <textarea
            rows={4}
            className="min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none ring-ring/50 focus-visible:border-ring focus-visible:ring-[3px]"
            placeholder="Enter details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2 text-xs">
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
        type="button"
        disabled={isSubmitting || !user}
        onClick={handleSchedule}
        className="flex w-full items-center justify-center rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50"
      >
        {isSubmitting ? "Scheduling..." : "Schedule Pickup"}
      </button>
    </div>
  )
}
