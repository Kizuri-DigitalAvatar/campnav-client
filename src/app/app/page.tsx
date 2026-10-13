"use client"

import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"
import { WorkerHome } from "@/components/home/worker-home"
import { ResidentHome } from "@/components/home/resident-home"
import { Skeleton } from "@/components/ui/skeleton"

// Signed-in home: a staff dashboard for camp staff, a stay dashboard for everyone else
export default function Home() {
  const { user, loading } = useAuth()

  if (loading || !user) {
    return (
      <div className="space-y-6 pb-4" aria-busy="true" aria-label="Loading your dashboard">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-3xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </div>
    )
  }

  return isWorker(user.role) ? <WorkerHome user={user} /> : <ResidentHome user={user} />
}
