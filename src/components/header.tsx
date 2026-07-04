"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, User, Menu, X, Home, Grid2X2, Bell, ChevronDown, Shirt, Utensils, ShoppingBag, Wrench, Brush, Truck, ClipboardList, ShoppingCart, Inbox } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"
import { NotificationBell } from "@/components/notification-bell"
import { cn } from "@/lib/utils"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "../../convex/_generated/api"

export function Header() {
    const { user } = useAuth()
    const userOrders = useQuery(api.orders.listForUser, user ? { userId: user._id } : "skip")
    const cartCount = useMemo(() => {
        if (!userOrders) return 0
        return userOrders
            .filter((o: any) => o.source === "shop" && (o.status === "pending" || o.status === "in_progress"))
            .reduce((sum: number, o: any) => sum + (o.quantity ?? 1), 0)
    }, [userOrders])
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isSearchExpanded, setIsSearchExpanded] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

    // Sub-services for the Services menu
    const serviceItems = [
        { href: "/laundry", label: "Laundry", icon: Shirt },
        { href: "/room-service", label: "Room Service", icon: Utensils },
        { href: "/shop", label: "Online Shop", icon: ShoppingBag },
        { href: "/maintenance", label: "Maintenance", icon: Wrench },
        { href: "/house-keeping", label: "Housekeeping", icon: Brush },
        { href: "/delivery", label: "Delivery", icon: Truck },
    ]

    // Check if current user is a worker
    const userIsWorker = user ? isWorker(user.role) : false

    // Navigation items - different for workers vs staff/visitors
    const navItems = userIsWorker
        ? [
            { href: "/", label: "Home", icon: Home },
            { href: "/assignments", label: "Assignments", icon: ClipboardList },
            { href: "/available-tasks", label: "Available Tasks", icon: Inbox },
            { href: "/shop", label: "Shop", icon: ShoppingBag },
            { href: "/updates", label: "Announcements", icon: Bell },
            { href: "/profile", label: "Profile", icon: User },
        ]
        : [
            { href: "/", label: "Home", icon: Home },
            {
                href: "/services",
                label: "Services",
                icon: Grid2X2,
                subItems: serviceItems
            },
            { href: "/updates", label: "Announcements", icon: Bell },
            { href: "/profile", label: "Profile", icon: User },
        ]

    const toggleSubmenu = (label: string) => {
        setOpenSubmenu(openSubmenu === label ? null : label)
    }

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
            setIsSearchExpanded(false)
        }
    }

    return (
        <>
            <header className="fixed top-0 inset-x-0 md:left-64 z-30 glass-panel border-b border-t-0 border-x-0">
                <div className="container flex items-center justify-between h-16 px-4 mx-auto md:px-6">
                    {/* Left: Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl tile-3d-primary text-primary-foreground font-extrabold text-sm">
                            CN
                        </div>
                        <span className="text-lg font-bold tracking-tight hidden md:inline-block">CAMPNAV</span>
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
                        {/* Burger Menu Button (Mobile Only) */}
                        <Link
                            href="/history"
                            className="relative md:hidden h-10 w-10 rounded-full border bg-card flex items-center justify-center hover:border-primary/60 hover:text-primary transition-colors active:scale-95"
                            aria-label="My orders"
                            title="My orders"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>

                        {/* Profile Avatar */}
                        <Link href="/profile">
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

            {/* Mobile Sidebar Menu */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-foreground/25 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    {/* Sidebar */}
                    <div className="fixed inset-y-0 right-0 w-3/4 max-w-sm glass-panel shadow-pop flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between p-4 border-b">
                            <span className="text-xl font-bold">Menu</span>
                            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                        <nav className="flex-1 overflow-y-auto p-6 space-y-6">
                            {navItems.map((item) => (
                                <div key={item.label} className="flex flex-col items-center w-full">
                                    {item.subItems ? (
                                        // Dropdown Item (Services)
                                        <div className="w-full flex flex-col items-center">
                                            <button
                                                onClick={() => toggleSubmenu(item.label)}
                                                className={cn(
                                                    "flex items-center justify-center w-full space-x-2 text-lg font-medium transition-colors hover:text-primary py-2 px-4 rounded-lg",
                                                    pathname.startsWith(item.href) || openSubmenu === item.label ? "text-primary bg-muted/50" : "text-muted-foreground"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5" />
                                                <span>{item.label}</span>
                                                <ChevronDown className={cn("h-4 w-4 ml-1 transition-transform", openSubmenu === item.label && "rotate-180")} />
                                            </button>

                                            {/* Dropdown Content */}
                                            {openSubmenu === item.label && (
                                                <div className="flex flex-col items-start w-full mt-2 pl-4 space-y-2 animate-in slide-in-from-top-2">
                                                    {item.subItems.map((subItem) => (
                                                        <Link
                                                            key={subItem.href}
                                                            href={subItem.href}
                                                            onClick={() => setIsMenuOpen(false)}
                                                            className={cn(
                                                                "flex items-center space-x-3 w-full p-2 rounded-md text-lg transition-colors hover:bg-muted/80",
                                                                pathname === subItem.href ? "text-primary font-semibold bg-muted" : "text-muted-foreground"
                                                            )}
                                                        >
                                                            <div className="p-1.5 rounded-full bg-background border shadow-sm">
                                                                <subItem.icon className="h-3 w-3" />
                                                            </div>
                                                            <span>{subItem.label}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Regular Item
                                        <Link
                                            href={item.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={cn(
                                                "flex items-center justify-center w-full space-x-2 text-lg font-medium transition-colors hover:text-primary py-2 px-4 rounded-lg",
                                                pathname === item.href ? "text-primary bg-muted/50" : "text-muted-foreground"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            <span>{item.label}</span>
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </>
    )
}
