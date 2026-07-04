"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "../../../convex/_generated/api"
import { Search, Package, Megaphone, Calendar, ArrowLeft, Clock, MapPin } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"

function SearchResults() {
    const searchParams = useSearchParams()
    const query = searchParams.get("q") ?? ""
    const results = useQuery(api.search.global, { query })

    if (results === undefined) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Search className="h-10 w-10 text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground text-sm">Searching...</p>
            </div>
        )
    }

    const hasResults =
        results.products.length > 0 ||
        results.announcements.length > 0 ||
        results.activities.length > 0

    if (!hasResults) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">No results found</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                    We couldn't find anything matching "{query}". Try different keywords or check your spelling.
                </p>
                <Link href="/" className="mt-8 text-primary font-semibold hover:underline flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            <header className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Search Results</p>
                <h1 className="text-2xl font-bold">Results for "{query}"</h1>
            </header>

            {/* Announcements Section */}
            {results.announcements.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold">Announcements</h2>
                    </div>
                    <div className="space-y-4">
                        {results.announcements.map((announcement) => (
                            <Link key={announcement._id} href={`/updates?id=${announcement._id}`}>
                                <Card className="p-4 hover:shadow-md transition-shadow">
                                    <div className="flex gap-4">
                                        {announcement.coverImageUrl && (
                                            <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden border">
                                                <img src={announcement.coverImageUrl} alt="" className="h-full w-full object-cover" />
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-sm leading-tight">{announcement.title}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {announcement.content}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Activities Section */}
            {results.activities.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold">Activities</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {results.activities.map((activity) => (
                            <Card key={activity._id} className="p-4">
                                <h3 className="font-semibold text-sm mb-2">{activity.title}</h3>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{activity.time}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{activity.location}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Products Section */}
            {results.products.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold">Products</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {results.products.map((product) => (
                            <Link key={product._id} href="/shop">
                                <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
                                    <div className="h-32 bg-muted relative">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground italic">
                                                No image
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 space-y-1 flex-1 flex flex-col">
                                        <h3 className="font-bold text-xs truncate">{product.name}</h3>
                                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight flex-1">
                                            {product.description}
                                        </p>
                                        <p className="text-sm font-bold text-primary pt-1">
                                            Le {product.price.toFixed(2)}
                                        </p>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20">
                <Search className="h-10 w-10 text-muted-foreground/20 mb-4 animate-pulse" />
                <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
        }>
            <SearchResults />
        </Suspense>
    )
}
