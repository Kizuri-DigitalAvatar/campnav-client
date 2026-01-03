"use client"

import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Card } from "@/components/ui/card"

export default function UpdatesPage() {
  const announcements = useQuery(api.announcements.list, { priority: "all" }) ?? []

  return (
    <div className="space-y-6 pb-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <p className="text-xs text-muted-foreground">
          Stay up to date with what&apos;s happening around camp.
        </p>
      </header>

      <div className="space-y-4">
        {announcements.map((item: any) => (
          <Card
            key={item._id}
            className="flex gap-3 overflow-hidden rounded-2xl border bg-card/90 p-3 shadow-sm"
          >
            <div className="h-20 w-24 rounded-xl bg-muted overflow-hidden shrink-0">
              {item.coverImageUrl ? (
                <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">{item.priority}</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className={`text-[11px] font-bold uppercase tracking-widest ${item.priority === 'High' || item.priority === 'high' ? 'text-destructive' : 'text-primary'
                }`}>
                {item.priority}
              </p>
              <h2 className="text-sm font-semibold leading-snug">
                {item.title}
              </h2>
              <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2">
                {item.content}
              </p>
            </div>
          </Card>
        ))}
        {announcements.length === 0 && (
          <div className="p-12 text-center text-muted-foreground italic text-xs">
            No announcements at this time.
          </div>
        )}
      </div>
    </div>
  )
}
