"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, Lock, Utensils, UtensilsCrossed } from "lucide-react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../convex/_generated/api"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MEAL_TYPE_ORDER = ["breakfast", "lunch", "dinner", "snack", "drink"]
const DIETARY_OPTIONS = ["Vegetarian", "No nuts", "No dairy", "Diabetic friendly", "Low salt"]
const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

type MenuItem = {
  name: string
  mealType: string
  description?: string
  imageUrl?: string | null
}

function getCurrentWeekStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay()) // back to Sunday
  return d.getTime()
}

function formatWeekLabel(weekStart: number) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  const start = new Date(weekStart).toLocaleDateString(undefined, opts)
  const end = new Date(weekStart + 6 * DAY_MS).toLocaleDateString(undefined, opts)
  return `${start} – ${end}`
}

export default function MealsPage() {
  const { user } = useAuth()
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart)

  const weekMenus = useQuery(api.menus.getWeek, { weekStart })
  const existingSelections = useQuery(
    api.meals.getWeeklyMealSelections,
    user ? { userId: user._id, weekStart } : "skip"
  )
  const saveWeeklySelections = useMutation(api.meals.saveWeeklyMealSelections)

  // key `${day}-${mealType}` -> selected item names
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  // meals the kitchen already picked up — shown but not editable
  const [lockedMeals, setLockedMeals] = useState<Set<string>>(new Set())
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([])
  const [riceType, setRiceType] = useState("rice")
  const [spiceLevel, setSpiceLevel] = useState("medium")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const loadedWeekRef = useRef<number | null>(null)

  const todayStart = useMemo(() => new Date().setHours(0, 0, 0, 0), [])

  // The admin's menu for each day, grouped by meal type
  const menuByDay = useMemo(() => {
    const byDay: Record<number, Record<string, MenuItem[]>> = {}
    ;(weekMenus || []).forEach((menu: any) => {
      if (menu.dayOfWeek === undefined) return
      const groups: Record<string, MenuItem[]> = {}
      ;(menu.items || []).forEach((item: MenuItem) => {
        const type = item.mealType || "lunch"
        groups[type] = [...(groups[type] || []), item]
      })
      byDay[menu.dayOfWeek] = groups
    })
    return byDay
  }, [weekMenus])

  // Prefill from what the user already selected for this week
  useEffect(() => {
    if (existingSelections === undefined || loadedWeekRef.current === weekStart) return
    loadedWeekRef.current = weekStart

    const nextSelections: Record<string, string[]> = {}
    const nextLocked = new Set<string>()
    existingSelections.forEach((order: any) => {
      const day = Math.round((order.date - weekStart) / DAY_MS)
      const key = `${day}-${order.mealType}`
      nextSelections[key] = order.items.map((item: any) => item.name)
      if (order.status !== "pending") nextLocked.add(key)
    })
    setSelections(nextSelections)
    setLockedMeals(nextLocked)
    setSavedAt(null)

    const latest = existingSelections[existingSelections.length - 1]
    if (latest) {
      setDietaryRestrictions(latest.dietaryRestrictions || [])
      if (latest.preferences) {
        setRiceType(latest.preferences.riceType)
        setSpiceLevel(latest.preferences.spiceLevel)
      }
      const firstNote = latest.items?.find((item: any) => item.specialInstructions)?.specialInstructions
      if (firstNote) setNotes(firstNote)
    }
  }, [existingSelections, weekStart])

  const changeWeek = (delta: number) => {
    loadedWeekRef.current = null
    setSelections({})
    setLockedMeals(new Set())
    setWeekStart((w) => w + delta * WEEK_MS)
  }

  const toggleItem = (day: number, mealType: string, name: string) => {
    const key = `${day}-${mealType}`
    if (lockedMeals.has(key)) return
    setSelections((prev) => {
      const current = prev[key] || []
      const next = current.includes(name)
        ? current.filter((n) => n !== name)
        : [...current, name]
      return { ...prev, [key]: next }
    })
  }

  const selectedMealCount = useMemo(
    () => Object.values(selections).filter((names) => names.length > 0).length,
    [selections]
  )

  async function handleSubmit() {
    if (!user) return

    // One entry per editable day + meal type on the menu, so deselections clear too
    const payload: { date: number; mealType: string; items: { name: string; quantity: number; specialInstructions?: string }[] }[] = []
    for (let day = 0; day < 7; day++) {
      const date = weekStart + day * DAY_MS
      if (date < todayStart) continue
      const groups = menuByDay[day]
      if (!groups) continue
      for (const mealType of Object.keys(groups)) {
        if (lockedMeals.has(`${day}-${mealType}`)) continue
        const names = selections[`${day}-${mealType}`] || []
        payload.push({
          date,
          mealType,
          items: names.map((name) => ({
            name,
            quantity: 1,
            specialInstructions: notes.trim() || undefined,
          })),
        })
      }
    }

    if (payload.every((p) => p.items.length === 0) && selectedMealCount === 0) {
      alert("Please select at least one meal from the menu.")
      return
    }

    setIsSubmitting(true)
    try {
      await saveWeeklySelections({
        userId: user._id,
        weekStart,
        dietaryRestrictions,
        preferences: { riceType, spiceLevel },
        selections: payload,
      })
      setSavedAt(Date.now())
    } catch (error) {
      console.error(error)
      alert("Failed to save your meal selections.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isCurrentWeek = weekStart === getCurrentWeekStart()
  const hasAnyMenu = Object.keys(menuByDay).length > 0

  return (
    <div className="space-y-6 pb-6 md:max-w-xl md:mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/services" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Services</span>
          </Link>
          <span>/</span>
          <span>Meal Selection</span>
        </div>
        <h1 className="text-xl font-semibold">Weekly Meal Selection</h1>
        <p className="text-xs text-muted-foreground">
          Pick your meals for each day from this week&apos;s menu set by the camp kitchen.
        </p>
      </header>

      <div className="flex items-center justify-between rounded-2xl border bg-card/90 px-2 py-1.5">
        <button type="button" onClick={() => changeWeek(-1)} className="rounded-xl p-2 hover:bg-muted" aria-label="Previous week">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-xs font-bold">
          {formatWeekLabel(weekStart)}
          {isCurrentWeek && <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-primary">This week</span>}
        </div>
        <button type="button" onClick={() => changeWeek(1)} className="rounded-xl p-2 hover:bg-muted" aria-label="Next week">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {weekMenus === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : !hasAnyMenu ? (
        <Card className="rounded-2xl border bg-card/90 p-6 text-center">
          <UtensilsCrossed className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No menu for this week yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The kitchen hasn&apos;t published this week&apos;s menu. Please check back soon.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {DAY_NAMES.map((dayName, day) => {
            const date = weekStart + day * DAY_MS
            const isPast = date < todayStart
            const groups = menuByDay[day]
            const orderedTypes = groups
              ? Object.keys(groups).sort(
                  (a, b) => (MEAL_TYPE_ORDER.indexOf(a) + 100) % 100 - (MEAL_TYPE_ORDER.indexOf(b) + 100) % 100
                )
              : []
            return (
              <Card key={day} className={`space-y-3 rounded-2xl border bg-card/90 p-4 shadow-sm ${isPast ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{dayName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  {isPast && <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Past</span>}
                </div>

                {!groups ? (
                  <p className="rounded-xl border border-dashed bg-background px-3 py-3 text-center text-[11px] text-muted-foreground">
                    No menu set for this day.
                  </p>
                ) : (
                  orderedTypes.map((mealType) => {
                    const key = `${day}-${mealType}`
                    const isLocked = lockedMeals.has(key)
                    const selected = selections[key] || []
                    return (
                      <div key={mealType} className="space-y-1.5">
                        <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                          {mealType}
                          {isLocked && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold normal-case tracking-normal text-muted-foreground">
                              <Lock className="h-2.5 w-2.5" /> In the kitchen
                            </span>
                          )}
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {groups[mealType].map((item) => {
                            const isSelected = selected.includes(item.name)
                            return (
                              <button
                                key={item.name}
                                type="button"
                                disabled={isPast || isLocked}
                                onClick={() => toggleItem(day, mealType, item.name)}
                                className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed ${
                                  isSelected ? "border-primary bg-primary/10" : "bg-background"
                                }`}
                              >
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="h-9 w-9 shrink-0 rounded-lg border object-cover" />
                                ) : (
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Utensils className="h-3.5 w-3.5 text-muted-foreground/50" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium">{item.name}</p>
                                  {item.description && (
                                    <p className="truncate text-[11px] text-muted-foreground">{item.description}</p>
                                  )}
                                </div>
                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Card className="space-y-5 rounded-2xl border bg-card/90 p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 text-xs">
            <label className="text-[11px] font-medium text-muted-foreground">Rice / bulgur</label>
            <select className="h-10 w-full rounded-xl border bg-background px-3 text-xs" value={riceType} onChange={(e) => setRiceType(e.target.value)}>
              <option value="rice">Rice</option>
              <option value="bulgur">Bulgur</option>
            </select>
          </div>
          <div className="space-y-1 text-xs">
            <label className="text-[11px] font-medium text-muted-foreground">Spice level</label>
            <select className="h-10 w-full rounded-xl border bg-background px-3 text-xs" value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value)}>
              <option value="mild">Mild</option>
              <option value="medium">Medium</option>
              <option value="spicy">Spicy</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground">Dietary requirements</p>
          <div className="grid grid-cols-2 gap-2">
            {DIETARY_OPTIONS.map((option) => (
              <label key={option} className="flex items-center gap-2 rounded-xl border bg-background p-2 text-[11px]">
                <input
                  type="checkbox"
                  checked={dietaryRestrictions.includes(option)}
                  onChange={(event) => setDietaryRestrictions((prev) => event.target.checked ? [...prev, option] : prev.filter((item) => item !== option))}
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <label className="text-[11px] font-medium text-muted-foreground">Kitchen notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[64px] w-full rounded-xl border bg-background px-3 py-2 text-xs" placeholder="Allergies, preparation notes, or anything the kitchen should know..." />
        </div>
      </Card>

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!user || isSubmitting || !hasAnyMenu}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Utensils className="h-4 w-4" />}
          {isSubmitting
            ? "Saving..."
            : `Save Weekly Selection${selectedMealCount > 0 ? ` (${selectedMealCount} meal${selectedMealCount === 1 ? "" : "s"})` : ""}`}
        </button>
        {savedAt && !isSubmitting && (
          <p className="text-center text-xs font-medium text-primary">Saved ✓ The kitchen has your selections for this week.</p>
        )}
      </div>
    </div>
  )
}
