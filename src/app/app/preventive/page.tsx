"use client"

import Link from "next/link"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { ArrowLeft, Calendar, CheckCircle2, ClipboardCheck, Clock } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../../convex/_generated/api"

const DAY = 24 * 60 * 60 * 1000

function whenLabel(item: any) {
  const start = new Date(item.nextDue)
  const startText = start.toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  if (!item.durationMinutes) return startText
  const end = new Date(item.nextDue + item.durationMinutes * 60000)
  return `${startText} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
}

function dueState(nextDue: number) {
  const diff = nextDue - Date.now()
  if (diff < 0) return { label: "Overdue", className: "bg-red-500/10 text-red-600 border-red-500/20" }
  if (diff <= DAY) return { label: "Due soon", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" }
  return { label: "Upcoming", className: "bg-muted text-muted-foreground border-border" }
}

export default function PreventiveMaintenancePage() {
  const { user } = useAuth()
  const items = useQuery(api.preventive.listForStaff, user ? { staffId: user._id } : "skip")
  const toggleItem = useMutation(api.preventive.toggleChecklistItem)
  const complete = useMutation(api.preventive.complete)

  return (
    <div className="space-y-6 pb-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/app" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span>Preventive Maintenance</span>
        </div>
        <h1 className="text-xl font-semibold">Preventive Maintenance</h1>
        <p className="text-xs text-muted-foreground">Recurring jobs assigned to you, soonest first.</p>
      </header>

      {items === undefined ? (
        <div className="space-y-3">
          {[0, 1].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed rounded-2xl">
          <ClipboardCheck className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nothing assigned to you</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => {
            const state = dueState(item.nextDue)
            const doneCount = item.checklist.filter((c: any) => c.completed).length
            return (
              <Card key={item._id} className="rounded-2xl border bg-card/90 p-4 space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h2 className="font-bold text-sm">{item.title}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {item.type.replaceAll("_", " ")} · {item.frequency}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${state.className}`}>
                    {state.label}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {whenLabel(item)}</p>
                  {item.lastCompleted && (
                    <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Last done {new Date(item.lastCompleted).toLocaleDateString()}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Checklist {doneCount}/{item.checklist.length}
                  </p>
                  {item.checklist.map((c: any, i: number) => (
                    <label key={i} className="flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={c.completed}
                        onChange={(e) => toggleItem({ id: item._id, index: i, completed: e.target.checked })}
                      />
                      <span className={`text-xs font-medium ${c.completed ? "line-through text-muted-foreground" : ""}`}>{c.item}</span>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (doneCount < item.checklist.length && !confirm("Not every checklist item is ticked. Mark this job done anyway?")) return
                    complete({ id: item._id, staffId: user!._id })
                  }}
                  className="w-full h-11 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark done
                </button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
