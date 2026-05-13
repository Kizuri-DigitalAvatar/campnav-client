"use client"

import { useQuery } from "convex/react"
import { useAuth } from "@/components/auth-provider"
import { api } from "../../../convex/_generated/api"
import { Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { RequestCard } from "@/components/request-card"

export default function RequestsPage() {
    const { user } = useAuth()
    const requests = useQuery(api.requests.listForUser, user ? { userId: user._id } : "skip") ?? []

    return (
        <div className="space-y-6 pb-20">
            <header className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link href="/services" className="inline-flex items-center gap-1">
                        <ArrowLeft className="h-3 w-3" />
                        <span>Services</span>
                    </Link>
                    <span>/</span>
                    <span>My Requests</span>
                </div>
                <h1 className="text-xl font-semibold">My Requests</h1>
                <p className="text-xs text-muted-foreground">
                    Track and manage all your active service requests.
                </p>
            </header>

            <div className="space-y-4">
                {requests.length > 0 ? (
                    requests
                        .sort((a: any, b: any) => {
                            // Active status first
                            const activeStatuses = ["pending", "in_progress"];
                            const aActive = activeStatuses.includes(a.status);
                            const bActive = activeStatuses.includes(b.status);
                            if (aActive && !bActive) return -1;
                            if (!aActive && bActive) return 1;
                            // Then most recent
                            return b.createdAt - a.createdAt;
                        })
                        .map((req: any) => (
                            <RequestCard key={req._id} request={req} />
                        ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                            <Clock className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">No requests yet</p>
                            <p className="text-xs text-muted-foreground max-w-[200px]">
                                Your service requests will appear here once you submit them.
                            </p>
                        </div>
                        <Link href="/services" className="text-xs font-semibold text-primary underline">
                            Browse Services
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
