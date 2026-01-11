"use client"

import Link from "next/link"
import { Search, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"

export function Header() {
    const { user } = useAuth()

    return (
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


                {/* Right: Profile Head */}
                <div className="flex items-center gap-2">
                    {/* Burger Menu Placeholder - logic handled in layout/burger-menu component, 
                but visual placement might need adjustment if it overlaps. 
                For now, keeping profile separate. */}
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
    )
}
