"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Menu, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { NotificationBell } from "@/components/notification-bell"
import { CampnavLogo } from "@/components/campnav-logo"
import { NavList } from "@/components/app-nav"
import { NavFooter } from "@/components/desktop-nav"

export function Header() {
    const { user } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [isSearchExpanded, setIsSearchExpanded] = useState(false)
    const router = useRouter()

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/app/search?q=${encodeURIComponent(searchQuery.trim())}`)
            setIsSearchExpanded(false)
        }
    }

    return (
        <>
            <header className="fixed top-0 inset-x-0 md:left-64 z-40 glass-panel border-b border-t-0 border-x-0">
                <div className="container flex items-center justify-between h-16 px-4 mx-auto md:px-6">
                    {/* Left: Logo */}
                    {/* The desktop sidebar carries the logo, so the header shows it on phones only */}
                    <Link href="/app" className="flex items-center gap-2 md:hidden">
                        <CampnavLogo size={34} alt="" priority />
                        <span className="sr-only">CAMPNAV home</span>
                    </Link>

                    {/* Middle: Search Bar (Desktop) */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 hidden md:block">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 rounded-full bg-muted/50 border-none focus-visible:ring-1"
                            />
                        </div>
                    </form>

                    {/* Mobile Search & Menu */}
                    <div className="flex items-center gap-1 md:hidden">
                        {isSearchExpanded ? (
                            <form onSubmit={handleSearch} className="flex items-center animate-in slide-in-from-right-5 duration-200">
                                <Input
                                    autoFocus
                                    type="search"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-9 w-[180px] rounded-full bg-muted/50 border-none focus-visible:ring-1 mr-1"
                                />
                                <Button variant="ghost" size="icon" type="button" onClick={() => setIsSearchExpanded(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </form>
                        ) : (
                            <Button variant="ghost" size="icon" onClick={() => setIsSearchExpanded(true)}>
                                <Search className="h-5 w-5" />
                            </Button>
                        )}
                    </div>

                    {/* Right: Notifications + Burger Menu + Profile */}
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={isMenuOpen}
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>

                        {/* Profile Avatar */}
                        <Link href="/app/profile">
                            <Avatar className="h-8 w-8 border-2 border-background shadow-sm hover:opacity-80 transition-opacity">
                                <AvatarImage src={user?.image} alt={user?.name || "User"} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {user?.name?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Mobile menu — same list as the desktop sidebar (see app-nav.tsx) */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="fixed inset-0 bg-foreground/25 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menu"
                        className="fixed inset-y-0 right-0 flex w-[85%] max-w-sm flex-col glass-panel shadow-pop animate-in slide-in-from-right duration-300"
                    >
                        <div className="flex items-center justify-between border-b p-4">
                            <Link href="/app" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2.5">
                                <CampnavLogo size={32} alt="" />
                                <span className="text-lg font-bold tracking-tight">CAMPNAV</span>
                            </Link>
                            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                        <nav aria-label="Main" className="flex-1 overflow-y-auto p-3">
                            <NavList onNavigate={() => setIsMenuOpen(false)} />
                        </nav>
                        <div className="border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                            <NavFooter />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
