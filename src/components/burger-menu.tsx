"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Home, Grid2X2, Bell, User, ClipboardList, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"

export function BurgerMenu() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const { user, loading } = useAuth()

    const navItems = user && isWorker(user.role)
        ? [
            { href: "/", label: "Home", icon: Home },
            { href: "/assignments", label: "Tasks", icon: ClipboardList },
            { href: "/history", label: "History", icon: History },
            { href: "/profile", label: "Profile", icon: User },
        ]
        : [
            { href: "/", label: "Home", icon: Home },
            { href: "/services", label: "Services", icon: Grid2X2 },
            { href: "/updates", label: "Updates", icon: Bell },
            { href: "/profile", label: "Profile", icon: User },
        ]

    return (
        <>
            <div className="fixed top-4 right-4 z-50 md:hidden">
                <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-background/80 backdrop-blur-sm shadow-md"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm animate-in fade-in slide-in-from-right-10 md:hidden">
                    <nav className="flex flex-col items-center justify-center h-full space-y-8">
                        <h2 className="text-2xl font-bold tracking-tight mb-4">Menu</h2>
                        {loading ? (
                            <>
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center space-x-2">
                                        <div className="w-5 h-5 rounded bg-muted animate-pulse" />
                                        <div className="w-24 h-6 rounded bg-muted animate-pulse" />
                                    </div>
                                ))}
                            </>
                        ) : (
                            navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center space-x-2 text-lg font-medium transition-colors hover:text-primary",
                                        pathname === item.href ? "text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                </Link>
                            ))
                        )}
                    </nav>
                </div>
            )}
        </>
    )
}
