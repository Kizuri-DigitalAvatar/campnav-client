"use client"

import { Card } from "@/components/ui/card"
import { Wrench, Brush, Shirt, Clock, CheckCircle2, PlayCircle, Truck } from "lucide-react"
import Link from "next/link"

interface RequestCardProps {
    request: any
}

const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
        case "maintenance": return <Wrench className="h-4 w-4" />
        case "housekeeping": return <Brush className="h-4 w-4" />
        case "laundry": return <Shirt className="h-4 w-4" />
        case "delivery": return <Truck className="h-4 w-4" />
        default: return <Clock className="h-4 w-4" />
    }
}

const getStatusStyle = (status: string) => {
    switch (status) {
        case "pending": return "bg-blue-500/10 text-blue-600 border-blue-500/20"
        case "in_progress": return "bg-amber-500/10 text-amber-600 border-amber-500/20"
        case "completed": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
        case "cancelled": return "bg-red-500/10 text-red-600 border-red-500/20"
        default: return "bg-muted text-muted-foreground border-border"
    }
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case "pending": return <Clock className="h-3 w-3" />
        case "in_progress": return <PlayCircle className="h-3 w-3" />
        case "completed": return <CheckCircle2 className="h-3 w-3" />
        default: return null
    }
}

export function RequestCard({ request: req }: RequestCardProps) {
    return (
        <Link href={`/requests/${req._id}`} className="block transition-transform active:scale-[0.98]">
            <Card className="relative overflow-hidden rounded-2xl border bg-card/90 p-4 shadow-sm hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                {getIcon(req.type)}
                            </div>
                            <div>
                                <p className="text-sm font-semibold capitalize">{req.type}</p>
                                <p className="text-[10px] text-muted-foreground">Room {req.roomNumber}</p>
                            </div>
                        </div>

                        <p className="text-xs text-foreground/80 leading-relaxed italic line-clamp-2">
                            "{req.description}"
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${getStatusStyle(req.status)}`}>
                                {getStatusIcon(req.status)}
                                {req.status.replace("_", " ")}
                            </div>
                        </div>
                    </div>
                    {req.imageUrl && (
                        <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/50">
                            <img src={req.imageUrl} alt="Request" className="h-full w-full object-cover" />
                        </div>
                    )}
                </div>
            </Card>
        </Link>
    )
}
