"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Grid2X2, Home, User, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
    const pathname = usePathname()

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
            <div className="grid h-full grid-cols-5 mx-auto font-medium">
                <Link
                    href="/"
                    className={cn(
                        "inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group",
                        pathname === "/" ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <Home className="w-6 h-6 mb-1 group-hover:text-primary" />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>
                <Link
                    href="/requests"
                    className={cn(
                        "inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group",
                        pathname === "/requests" ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <ClipboardList className="w-6 h-6 mb-1 group-hover:text-primary" />
                    <span className="text-[10px] font-medium">Requests</span>
                </Link>
                <Link
                    href="/services"
                    className={cn(
                        "inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group",
                        pathname === "/services" ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <Grid2X2 className="w-6 h-6 mb-1 group-hover:text-primary" />
                    <span className="text-[10px] font-medium">Services</span>
                </Link>
                <Link
                    href="/updates"
                    className={cn(
                        "inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group",
                        pathname === "/updates" ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <Bell className="w-6 h-6 mb-1 group-hover:text-primary" />
                    <span className="text-[10px] font-medium">Updates</span>
                </Link>
                <Link
                    href="/profile"
                    className={cn(
                        "inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group",
                        pathname === "/profile" ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <User className="w-6 h-6 mb-1 group-hover:text-primary" />
                    <span className="text-[10px] font-medium">Profile</span>
                </Link>
            </div>
        </div>
    )
}
