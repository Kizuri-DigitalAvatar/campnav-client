"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { Calendar, Check, CheckCircle2, Clock, Loader2, Repeat } from "lucide-react"
import { toast } from "sonner"
import { api } from "../../../../../convex/_generated/api"
import { useAuth } from "@/components/auth-provider"
import { ServiceArt, celebrate } from "@/components/visuals"
import { ActionBar, CollectionEmpty, PageHeader, PageSkeleton } from "@/components/collection"
import { ChecklistRing, dueState, whenLabel } from "@/components/preventive-card"

/** One preventive job: tick its checklist, then mark it done. */
export default function PreventiveJobPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const items = useQuery(api.preventive.listForStaff, user ? { staffId: user._id } : "skip")
  const toggleItem = useMutation(api.preventive.toggleChecklistItem)
  const complete = useMutation(api.preventive.complete)
  const [completing, setCompleting] = useState(false)
  const [now] = useState(() => Date.now())

  if (!user || items === undefined) return <PageSkeleton view="list" />

  const item = items.find((i: any) => i._id === id)
  if (!item) {
    return (
      <div className="space-y-5">
        <PageHeader title="Job" back={{ href: "/app/preventive", label: "Preventive Maintenance" }} />
        <CollectionEmpty art="search" title="Job not found" hint="It may have been reassigned." action={{ label: "Back to jobs", href: "/app/preventive" }} />
      </div>
    )
  }

  const state = dueState(item.nextDue, now)
  const done = item.checklist.filter((c: any) => c.completed).length
  const total = item.checklist.length
  const jobId = item._id

  async function markDone() {
    if (done < total && !confirm("Not every checklist item is ticked. Mark this job done anyway?")) return
    setCompleting(true)
    try {
      await complete({ id: jobId, staffId: user!._id })
      celebrate({ title: "Job done!", message: "The next one is scheduled automatically.", kind: "maintenance" })
      router.push("/app/preventive")
    } catch (e) {
      console.error(e)
      toast.error("Could not mark the job done")
      setCompleting(false)
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <PageHeader title="Job details" back={{ href: "/app/preventive", label: "Preventive Maintenance" }} />

      <section className="space-y-4 rounded-3xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex items-start gap-3">
          <ServiceArt kind="maintenance" size={60} motion="ambient" tone={state.key === "overdue" ? "rose" : "blue"} />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black leading-tight">{item.title}</h2>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{item.type.replaceAll("_", " ")}</p>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${state.className}`}>{state.label}</span>
        </div>
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{whenLabel(item)}</p>
          <p className="flex items-center gap-2 capitalize"><Repeat className="h-4 w-4" />{item.frequency}</p>
          {item.lastCompleted && <p className="flex items-center gap-2"><Clock className="h-4 w-4" />Last done {new Date(item.lastCompleted).toLocaleDateString()}</p>}
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <ChecklistRing done={done} total={total} size={48} />
          <div>
            <h2 className="text-sm font-black">Checklist</h2>
            <p className="text-xs text-muted-foreground">{done === total && total > 0 ? "Everything ticked." : "Tap each step as you finish it."}</p>
          </div>
        </div>
        <ul className="space-y-2">
          {item.checklist.map((c: any, i: number) => (
            <li key={i}>
              <button
                type="button"
                role="checkbox"
                aria-checked={c.completed}
                onClick={() => {
                  try { navigator.vibrate?.(10) } catch {}
                  toggleItem({ id: item._id, index: i, completed: !c.completed })
                }}
                className={`flex min-h-12 w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all active:scale-[0.98] ${c.completed ? "border-emerald-500/30 bg-emerald-500/5" : "bg-muted/30 hover:bg-muted/60"}`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${c.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40"}`}>
                  {c.completed && <Check className="h-4 w-4 animate-in zoom-in-50 duration-200" strokeWidth={3} />}
                </span>
                <span className={`text-sm font-medium ${c.completed ? "text-muted-foreground line-through" : ""}`}>{c.item}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <ActionBar>
        <button
          type="button"
          onClick={markDone}
          disabled={completing}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-xs font-black uppercase tracking-widest text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
        >
          {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Mark done
        </button>
      </ActionBar>
    </div>
  )
}
