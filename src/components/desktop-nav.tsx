"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Grid2X2, Home, User, LayoutDashboard, ClipboardList, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"

export function DesktopNav() {
    const pathname = usePathname()
    const { user, loading } = useAuth()

    const navItems = user && isWorker(user.role)
        ? [
            { name: 'Home', href: '/', icon: Home },
            { name: 'Tasks', href: '/assignments', icon: ClipboardList },
            { name: 'History', href: '/history', icon: History },
            { name: 'Profile', href: '/profile', icon: User },
        ]
        : [
            { name: 'Home', href: '/', icon: Home },
            { name: 'Services', href: '/services', icon: Grid2X2 },
            { name: 'Updates', href: '/updates', icon: Bell },
            { name: 'Profile', href: '/profile', icon: User },
        ]

    return (
        <aside className="hidden md:flex flex-col w-64 border-r bg-card/50 backdrop-blur-xl h-screen sticky top-0">
            <div className="p-6 mb-4 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <LayoutDashboard size={18} className="text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">CAMPNAV</h1>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {loading ? (
                    <>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center space-x-3 px-4 py-3">
                                <div className="w-5 h-5 rounded bg-muted animate-pulse" />
                                <div className="w-24 h-4 rounded bg-muted animate-pulse" />
                            </div>
                        ))}
                    </>
                ) : (
                    navItems.map((item: any) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                                pathname === item.href
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <item.icon size={18} className={cn(
                                "transition-transform group-hover:scale-110",
                                pathname === item.href ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            <span>{item.name}</span>
                        </Link>
                    ))
                )}
            </nav>

            <div className="p-4 mt-auto space-y-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-medium text-muted-foreground">Appearance</span>
                    <ModeToggle />
                </div>
                <div className="bg-muted/50 rounded-2xl p-4 border border-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Visitor Support</p>
                    <button className="w-full py-2 bg-background border rounded-lg text-xs font-medium hover:bg-muted transition-colors">
                        Contact Staff
                    </button>
                </div>
            </div>
        </aside>
    )
}
