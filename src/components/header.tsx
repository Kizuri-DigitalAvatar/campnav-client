"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, User, Menu, X, Home, Grid2X2, Bell, ChevronDown, Shirt, Utensils, ShoppingBag, Wrench, Broom, Truck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

export function Header() {
    const { user } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
    const pathname = usePathname()

    // Sub-services for the Services menu
    const serviceItems = [
        { href: "/laundry", label: "Laundry", icon: Shirt },
        { href: "/room-service", label: "Room Service", icon: Utensils },
        { href: "/shop", label: "Online Shop", icon: ShoppingBag },
        { href: "/maintenance", label: "Maintenance", icon: Wrench },
        { href: "/house-keeping", label: "Housekeeping", icon: Broom },
        { href: "/delivery", label: "Delivery", icon: Truck },
    ]

    const navItems = [
        { href: "/", label: "Home", icon: Home },
        {
            href: "/services",
            label: "Services",
            icon: Grid2X2,
            subItems: serviceItems
        },
        { href: "/updates", label: "Updates", icon: Bell },
        { href: "/profile", label: "Profile", icon: User },
    ]

    const toggleSubmenu = (label: string) => {
        setOpenSubmenu(openSubmenu === label ? null : label)
    }

    return (
        <>
            <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b">
                <div className="container flex items-center justify-between h-16 px-4 mx-auto md:px-6">
                    {/* Left: Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold">
                            CN
                        </div>
                        <span className="text-lg font-bold tracking-tight hidden md:inline-block">CAMPNAV</span>
                    </Link>

                    {/* Middle: Search Bar */}
                    <div className="flex-1 max-w-md mx-4 hidden md:block">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search..."
                                className="w-full pl-9 rounded-full bg-muted/50 border-none focus-visible:ring-1"
                            />
                        </div>
                    </div>
                    {/* Mobile Search Icon */}
                    <Button variant="ghost" size="icon" className="md:hidden ml-auto mr-2">
                        <Search className="h-5 w-5" />
                    </Button>

                    {/* Right: Burger Menu + Profile */}
                    <div className="flex items-center gap-2">
                        {/* Burger Menu Button (Mobile Only) */}
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

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm animate-in fade-in slide-in-from-right-10 md:hidden overflow-y-auto">
                    <nav className="flex flex-col items-center justify-start pt-24 min-h-screen space-y-6 pb-10">
                        <h2 className="text-2xl font-bold tracking-tight mb-4">Menu</h2>
                        {navItems.map((item) => (
                            <div key={item.label} className="flex flex-col items-center w-full max-w-xs">
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
                                                            "flex items-center space-x-3 w-full p-2 rounded-md text-sm transition-colors hover:bg-muted/80",
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
            )}
        </>
    )
}
