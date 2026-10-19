"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "convex-helpers/react/cache"
import { ChevronRight } from "lucide-react"
import { api } from "../../../../convex/_generated/api"
import { ServiceArt } from "@/components/visuals"
import { AnnouncementCard, ActivityCard } from "@/components/update-cards"
import {
    CardLink, Collection, CollectionEmpty, CollectionItem, CollectionToolbar, FilterChips, PageHeader, PageSkeleton,
    SectionLabel, ViewToggle, useViewPreference, type ChipOption, type CollectionView,
} from "@/components/collection"

type Kind = "all" | "announcements" | "activities" | "products"

function ProductCard({ product, variant }: { product: any; variant: CollectionView }) {
    const link = <CardLink href={`/app/shop?product=${product._id}`} label={`${product.name}, Le ${product.price.toFixed(2)}`} />
    const picture = (cls: string, size: number) => product.imageUrl ? (
        <div className={`shrink-0 overflow-hidden bg-muted ${cls}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
    ) : <ServiceArt kind="shop" size={size} />

    if (variant === "list") {
        return (
            <article className="va-trigger glass-card group relative flex items-center gap-3 rounded-2xl p-3 transition-transform active:scale-[0.985]">
                {link}
                {picture("h-14 w-14 rounded-xl border", 56)}
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-black">{product.name}</h3>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{product.description}</p>
                </div>
                <p className="shrink-0 text-sm font-black text-primary">Le {product.price.toFixed(2)}</p>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
            </article>
        )
    }
    return (
        <article className="va-trigger glass-card group relative flex h-full flex-col overflow-hidden rounded-3xl transition-transform active:scale-[0.99]">
            {link}
            {product.imageUrl ? picture("h-36 w-full border-b", 0) : (
                <div className="flex h-36 items-center justify-center border-b bg-muted/30"><ServiceArt kind="shop" size={72} /></div>
            )}
            <div className="flex flex-1 flex-col gap-1 p-4">
                <h3 className="truncate text-sm font-black">{product.name}</h3>
                <p className="line-clamp-2 flex-1 text-xs text-muted-foreground">{product.description}</p>
                <p className="pt-1 text-base font-black text-primary">Le {product.price.toFixed(2)}</p>
            </div>
        </article>
    )
}

function SearchResults() {
    const searchParams = useSearchParams()
    const query = searchParams.get("q") ?? ""
    const results = useQuery(api.search.global, { query })
    const [kind, setKind] = useState<Kind>("all")
    const [view, setView] = useViewPreference("campnav:search-view")

    if (results === undefined) return <PageSkeleton view={view} />

    const total = results.products.length + results.announcements.length + results.activities.length
    const header = (
        <PageHeader
            art="search"
            title={query ? `“${query}”` : "Search"}
            subtitle={total ? `${total} result${total === 1 ? "" : "s"} across the camp` : undefined}
            back
        />
    )

    if (total === 0) {
        return (
            <div className="space-y-5">
                {header}
                <CollectionEmpty
                    art="search"
                    title="No results found"
                    hint={`We couldn't find anything matching “${query}”. Try a different word.`}
                    action={{ label: "Back to home", href: "/app" }}
                />
            </div>
        )
    }

    const chips: ChipOption<Kind>[] = [
        { key: "all", label: "All", count: total },
        { key: "announcements", label: "Announcements", count: results.announcements.length },
        { key: "activities", label: "Events", count: results.activities.length },
        { key: "products", label: "Products", count: results.products.length },
    ].filter((c) => c.key === "all" || c.count > 0) as ChipOption<Kind>[]

    const show = (k: Kind) => (kind === "all" || kind === k)

    return (
        <div className="space-y-5 pb-10 md:space-y-6">
            {header}
            <FilterChips label="Filter results" options={chips} value={kind} onChange={setKind} />
            <CollectionToolbar>
                <div className="flex-1" />
                <ViewToggle view={view} onChange={setView} label="Result layout" />
            </CollectionToolbar>

            {show("announcements") && results.announcements.length > 0 && (
                <section className="space-y-3">
                    <SectionLabel title="Announcements" count={results.announcements.length} />
                    <Collection view={view} label="Announcements">
                        {results.announcements.map((a, i) => (
                            <CollectionItem key={a._id} index={i}><AnnouncementCard item={a} variant={view} /></CollectionItem>
                        ))}
                    </Collection>
                </section>
            )}
            {show("activities") && results.activities.length > 0 && (
                <section className="space-y-3">
                    <SectionLabel title="Events" count={results.activities.length} />
                    <Collection view={view} label="Events">
                        {results.activities.map((a, i) => (
                            <CollectionItem key={a._id} index={i}><ActivityCard item={a} variant={view} /></CollectionItem>
                        ))}
                    </Collection>
                </section>
            )}
            {show("products") && results.products.length > 0 && (
                <section className="space-y-3">
                    <SectionLabel title="Products" count={results.products.length} />
                    <Collection view={view} label="Products" gridClassName="grid-cols-2 lg:grid-cols-4">
                        {results.products.map((p, i) => (
                            <CollectionItem key={p._id} index={i}><ProductCard product={p} variant={view} /></CollectionItem>
                        ))}
                    </Collection>
                </section>
            )}
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={<PageSkeleton view="list" />}>
            <SearchResults />
        </Suspense>
    )
}
