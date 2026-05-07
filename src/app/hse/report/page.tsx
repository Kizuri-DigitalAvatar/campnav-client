"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Upload, X, ShieldAlert, AlertTriangle } from "lucide-react"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../../convex/_generated/api"

const TYPES = [
  { label: "Incident", value: "incident", icon: ShieldAlert },
  { label: "Hazard", value: "hazard", icon: AlertTriangle },
]

const LOCATIONS = ["Camp", "Site"]
const SEVERITIES = ["Low", "Medium", "High", "Critical"]

export default function HSEReportPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [type, setType] = useState("incident")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("Camp")
  const [severity, setSeverity] = useState("Low")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const reportIncident = useMutation(api.hse.reportIncident)
  const generateUploadUrl = useMutation(api.images.generateUploadUrl)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !title.trim() || !description.trim()) return
    
    setIsSubmitting(true)
    const storageIds = []

    try {
      for (const file of selectedFiles) {
        const postUrl = await generateUploadUrl()
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        })
        const { storageId } = await result.json()
        storageIds.push(storageId)
      }

      await reportIncident({
        title: title.trim(),
        description: description.trim(),
        type,
        location,
        severity,
        reportedBy: user._id,
        images: storageIds,
      })

      alert("HSE Report submitted successfully!")
      router.push("/services")
    } catch (err) {
      console.error(err)
      alert("Failed to submit report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-6 md:max-w-xl md:mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/services" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Services</span>
          </Link>
          <span>/</span>
          <span>HSE Report</span>
        </div>
        <h1 className="text-xl font-semibold">HSE Incident/Hazard Report</h1>
        <p className="text-xs text-muted-foreground">
          Reporting is essential for maintaining a safe environment. Please provide details of the incident or hazard.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-4 space-y-4 rounded-2xl border bg-card/90 shadow-sm">
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground">Report Type</p>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold transition-all ${
                    type === t.value 
                      ? "bg-primary text-primary-foreground border-primary shadow-md" 
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="block text-[11px] font-medium text-muted-foreground ml-1">
              Title
            </label>
            <Input
              placeholder="e.g. Slippery floor in canteen"
              className="h-11 rounded-xl"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 text-xs">
              <label className="block text-[11px] font-medium text-muted-foreground ml-1">
                Location
              </label>
              <select
                className="h-11 w-full rounded-xl border bg-background px-3 outline-none"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1 text-xs">
              <label className="block text-[11px] font-medium text-muted-foreground ml-1">
                Severity
              </label>
              <select
                className="h-11 w-full rounded-xl border bg-background px-3 outline-none"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="block text-[11px] font-medium text-muted-foreground ml-1">
              Description
            </label>
            <textarea
              rows={4}
              className="w-full rounded-xl border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
              placeholder="Provide as much detail as possible..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3 border-t pt-4">
            <p className="text-[11px] font-medium text-muted-foreground ml-1">
              Photos (optional)
            </p>
            <div className="flex gap-3 flex-wrap">
              {previews.map((preview, i) => (
                <div key={i} className="relative h-20 w-20 group">
                  <img src={preview} alt="Preview" className="h-full w-full rounded-xl object-cover border" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-input bg-muted/40 text-[10px] text-muted-foreground hover:border-primary/50 transition-all">
                <Upload className="h-4 w-4 mb-1" />
                <span>Add Photo</span>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
              </label>
            </div>
          </div>
        </Card>

        <button
          type="submit"
          disabled={isSubmitting || !user}
          className="flex w-full items-center justify-center rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {isSubmitting ? "SUBMITTING REPORT..." : "SUBMIT HSE REPORT"}
        </button>
      </form>
    </div>
  )
}
