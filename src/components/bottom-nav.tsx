"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Grid2X2, Home, User, ClipboardList, History, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"

export function BottomNav() {
    const pathname = usePathname()
    const { user, loading } = useAuth()

    const navItems = user && isWorker(user.role)
        ? [
            { href: "/", label: "Home", icon: Home },
            { href: "/assignments", label: "Tasks", icon: ClipboardList },
            { href: "/available-tasks", label: "Available", icon: Inbox },
            { href: "/history", label: "History", icon: History },
            { href: "/profile", label: "Profile", icon: User },
        ]
        : [
            { href: "/", label: "Home", icon: Home },
            { href: "/services", label: "Services", icon: Grid2X2 },
            { href: "/updates", label: "Updates", icon: Bell },
            { href: "/profile", label: "Profile", icon: User },
        ]

    if (loading) {
        return (
            <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
                <div className="grid h-full grid-cols-4 mx-auto">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col items-center justify-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
                            <div className="w-8 h-2 rounded bg-muted animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
            <div className={`grid h-full ${navItems.length === 5 ? "grid-cols-5" : "grid-cols-4"} mx-auto font-medium`}>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group",
                            pathname === item.href ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <item.icon className="w-6 h-6 mb-1 group-hover:text-primary" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}
