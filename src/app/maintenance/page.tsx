"use client"

import Link from "next/link"
import { useQuery } from "convex-helpers/react/cache"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../convex/_generated/api"
import { Card } from "@/components/ui/card"

export default function MaintenancePage() {
  const { user } = useAuth()
  const requests = useQuery(api.requests.listForUser, user ? { userId: user._id } : "skip") ?? []

  return (
    <div className="space-y-6 pb-4">
      <header className="space-y-2">
        <p className="text-xs text-muted-foreground">Services / Maintenance</p>
        <h1 className="text-xl font-semibold">My Requests</h1>
        <p className="text-xs text-muted-foreground">
          Track the status of your maintenance requests.
        </p>
      </header>

      <Link href="/maintenance/request" className="block">
        <div className="flex items-center justify-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            +
          </span>
          <span>Make a Request</span>
        </div>
      </Link>

      <div className="space-y-4">
        {requests.map((req: any) => (
          <Card
            key={req._id}
            className="flex gap-3 overflow-hidden rounded-2xl border bg-card/90 p-3 shadow-sm"
          >
            <div className="h-20 w-24 rounded-xl bg-muted overflow-hidden shrink-0">
              {req.imageUrl ? (
                <img src={req.imageUrl} alt="Request" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold px-2 text-center">{req.type}</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2 text-xs">
              <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${req.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                  req.status === 'in_progress' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                    'bg-blue-500/10 text-blue-600 border-blue-500/20'
                }`}>
                {req.status}
              </div>
              <p className="text-[11px] leading-snug text-foreground line-clamp-2">
                {req.description}
              </p>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                <span className="font-mono text-[9px]">{req._id.substring(0, 8)}</span>
              </div>
            </div>
          </Card>
        ))}
        {requests.length === 0 && (
          <div className="p-12 text-center text-muted-foreground italic text-xs">
            No maintenance requests found.
          </div>
        )}
      </div>
    </div>
  )
}
