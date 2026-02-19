"use client"

import { useQuery } from "convex/react"
import { useParams, useRouter } from "next/navigation"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"
import { ArrowLeft, Clock, MapPin, Calendar, Users, Info } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function ActivityDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const activity = useQuery(api.activities.get, { id: id as Id<"activities"> })

    if (activity === undefined) {
        return (
            <div className="space-y-6 pb-20">
                <Skeleton className="h-64 w-full rounded-3xl" />
                <div className="space-y-3">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        )
    }

    if (!activity) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <p className="text-muted-foreground">Activity not found</p>
                <button onClick={() => router.back()} className="text-primary font-bold">Go Back</button>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="space-y-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft size={14} />
                    Back to Board
                </button>

                <div className={`w-full h-48 rounded-3xl flex flex-col items-center justify-center text-white relative overflow-hidden shadow-xl shadow-primary/5 ${activity.category === 'Social' ? 'bg-blue-600' :
                    activity.category === 'Outdoor' ? 'bg-emerald-600' :
                        activity.category === 'Workshop' ? 'bg-amber-600' : 'bg-primary'
                    }`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Calendar size={120} />
                    </div>
                    <div className="relative z-10 text-center space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">{activity.category}</span>
                        <h1 className="text-3xl font-black tracking-tighter uppercase">{activity.title}</h1>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col items-center text-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Time</p>
                        <p className="text-sm font-bold">{activity.time}</p>
                    </div>
                </div>
                <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col items-center text-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Date</p>
                        <p className="text-sm font-bold">{new Date(activity.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    </div>
                </div>
                <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col items-center text-center gap-2 col-span-2">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <MapPin size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Location</p>
                        <p className="text-sm font-bold">{activity.location}</p>
                    </div>
                </div>
            </div>

            <article className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Info size={14} className="text-primary" />
                    About this activity
                </h2>
                <div className="bg-muted/30 rounded-3xl p-6 border border-border/50">
                    <p className="text-base leading-relaxed font-medium text-foreground/80 whitespace-pre-wrap">
                        {activity.description}
                    </p>
                </div>
            </article>

            {activity.capacity && (
                <div className="bg-primary/5 rounded-3xl p-6 flex items-center justify-between border border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-tight">Capacity</h3>
                            <p className="text-xs text-muted-foreground">Limited to {activity.capacity} participants</p>
                        </div>
                    </div>
                    <div className="text-2xl font-black text-primary/30">
                        {activity.capacity}
                    </div>
                </div>
            )}

            <button className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98]">
                Interested
            </button>
        </div>
    )
}
