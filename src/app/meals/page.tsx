"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChefHat, Plus, Utensils } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { useRouter } from "next/navigation"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../convex/_generated/api"

const MEAL_ITEMS = ["Jollof rice", "Plain rice", "Bulgur", "Chicken", "Fish", "Vegetables", "Salad"]
const DIETARY_OPTIONS = ["Vegetarian", "No nuts", "No dairy", "Diabetic friendly", "Low salt"]

export default function MealsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const createMealOrder = useMutation(api.meals.createMealOrder)
  const previousOrders = useQuery(api.meals.getMealOrders, user ? { userId: user._id } : "skip")

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [mealType, setMealType] = useState("lunch")
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({ "Jollof rice": 1 })
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([])
  const [riceType, setRiceType] = useState("rice")
  const [spiceLevel, setSpiceLevel] = useState("medium")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const latestPreferences = useMemo(() => previousOrders?.[0]?.preferences, [previousOrders])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return

    const items = Object.entries(selectedItems)
      .filter(([, quantity]) => quantity > 0)
      .map(([name, quantity]) => ({
        name,
        quantity,
        specialInstructions: notes.trim() || undefined,
      }))

    if (items.length === 0) {
      alert("Please choose at least one meal item.")
      return
    }

    setIsSubmitting(true)
    try {
      await createMealOrder({
        userId: user._id,
        date: new Date(date).getTime(),
        mealType,
        items,
        dietaryRestrictions,
        preferences: { riceType, spiceLevel },
      })
      router.push("/services")
    } catch (error) {
      console.error(error)
      alert("Failed to submit meal selection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-6 md:max-w-xl md:mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/services" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Services</span>
          </Link>
          <span>/</span>
          <span>Meal Selection</span>
        </div>
        <h1 className="text-xl font-semibold">Meal Management</h1>
        <p className="text-xs text-muted-foreground">
          Pre-order meals and save dietary preferences for the kitchen inventory plan.
        </p>
      </header>

      <Card className="space-y-5 rounded-2xl border bg-card/90 p-4 shadow-sm">
        {latestPreferences && (
          <div className="rounded-xl border bg-primary/5 p-3 text-[11px] text-muted-foreground">
            Last preference: {latestPreferences.riceType} / {latestPreferences.spiceLevel}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 text-xs">
            <label className="text-[11px] font-medium text-muted-foreground">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-1 text-xs">
            <label className="text-[11px] font-medium text-muted-foreground">Meal</label>
            <select className="h-10 w-full rounded-xl border bg-background px-3 text-xs" value={mealType} onChange={(e) => setMealType(e.target.value)}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground">Daily meal selection</p>
          <div className="grid grid-cols-1 gap-2">
            {MEAL_ITEMS.map((item) => (
              <div key={item} className="flex items-center justify-between rounded-xl border bg-background px-3 py-2">
                <span className="text-xs font-medium">{item}</span>
                <div className="flex items-center gap-2">
                  <button type="button" className="h-7 w-7 rounded-lg border" onClick={() => setSelectedItems((prev) => ({ ...prev, [item]: Math.max(0, (prev[item] || 0) - 1) }))}>-</button>
                  <span className="w-5 text-center text-xs font-bold">{selectedItems[item] || 0}</span>
                  <button type="button" className="h-7 w-7 rounded-lg border bg-primary/10 text-primary" onClick={() => setSelectedItems((prev) => ({ ...prev, [item]: (prev[item] || 0) + 1 }))}>
                    <Plus className="mx-auto h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

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
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[88px] w-full rounded-xl border bg-background px-3 py-2 text-xs" placeholder="Any first-time user preferences or special preparation notes..." />
        </div>
      </Card>

      <button disabled={!user || isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
        <Utensils className="h-4 w-4" />
        {isSubmitting ? "Submitting..." : "Submit Meal Selection"}
      </button>
    </form>
  )
}
