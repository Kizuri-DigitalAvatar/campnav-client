"use client"

import { useQuery } from "convex-helpers/react/cache"
import { api } from "../../convex/_generated/api"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"

/**
 * Warms the query cache with the data each page needs, right after login,
 * so navigating around the app renders instantly instead of showing
 * loading skeletons. Uses the exact queries + args the pages use, so the
 * cache keys match. Data stays live via Convex's websocket.
 */
export function DataPrefetcher() {
    const { user } = useAuth()
    const userId = user?._id
    const worker = !!user && isWorker(user.role)

    // Shared content
    useQuery(api.announcements.list, { priority: "all" })
    useQuery(api.activities.list)
    useQuery(api.products.list, {})
    useQuery(api.products.list, { category: "all" })
    useQuery(api.menus.list, {})

    // Per-user data
    useQuery(api.orders.listForUser, userId ? { userId } : "skip")
    useQuery(api.requests.listForUser, userId && !worker ? { userId } : "skip")
    useQuery(api.rnrRequests.getRequestsByUser, userId ? { userId } : "skip")

    // Staff data
    useQuery(api.tasks.getWorkerAssignments, userId && worker ? { workerId: userId } : "skip")

    return null
}
