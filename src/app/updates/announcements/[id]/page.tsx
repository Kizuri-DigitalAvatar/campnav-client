"use client"

import { useQuery } from "convex-helpers/react/cache"
import { useParams, useRouter } from "next/navigation"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"
import { ArrowLeft, Clock, User, Megaphone } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnnouncementDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const announcement = useQuery(api.announcements.get, { id: id as Id<"announcements"> })

    if (announcement === undefined) {
        return (
            <div className="space-y-6 pb-20">
                <Skeleton className="h-48 w-full rounded-3xl" />
                <div className="space-y-3">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        )
    }

    if (!announcement) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <p className="text-muted-foreground">Announcement not found</p>
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

                {announcement.coverImageUrl && (
                    <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-xl shadow-primary/5">
                        <img
                            src={announcement.coverImageUrl}
                            alt={announcement.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
            </header>

            <article className="space-y-6">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${announcement.priority === 'High' || announcement.priority === 'high'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-primary/10 text-primary'
                            }`}>
                            {announcement.priority} PRIORITY
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <Clock size={12} />
                            {new Date(announcement.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </div>
                    </div>

                    <h1 className="text-3xl font-black tracking-tight leading-tight">
                        {announcement.title}
                    </h1>

                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl w-fit">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <User size={16} />
                        </div>
                        <div className="pr-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Posted by</p>
                            <p className="text-sm font-bold">{announcement.author}</p>
                        </div>
                    </div>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="text-base leading-relaxed text-foreground/80 whitespace-pre-wrap font-medium">
                        {announcement.content}
                    </div>
                </div>
            </article>

            <footer className="pt-10 border-t">
                <div className="bg-primary/5 rounded-3xl p-6 flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
                        <Megaphone size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-tight mb-1">Important Update</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            This announcement was posted to inform all camp residents about current updates and changes.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
