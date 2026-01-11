"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, User, Menu, X, Home, Grid2X2, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

export function Header() {
    const { user } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const pathname = usePathname()

    const navItems = [
        { href: "/", label: "Home", icon: Home },
        { href: "/services", label: "Services", icon: Grid2X2 },
        { href: "/updates", label: "Updates", icon: Bell },
        { href: "/profile", label: "Profile", icon: User },
    ]

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
                <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm animate-in fade-in slide-in-from-right-10 md:hidden">
                    <nav className="flex flex-col items-center justify-center h-full space-y-8">
                        <h2 className="text-2xl font-bold tracking-tight mb-4">Menu</h2>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                    "flex items-center space-x-2 text-lg font-medium transition-colors hover:text-primary",
                                    pathname === item.href ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </>
    )
}
