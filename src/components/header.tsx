import Link from "next/link"
import { Compass } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:flex">
            <div className="container flex h-14 items-center pl-4 pr-4">
                <div className="mr-4 flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Compass className="h-6 w-6" />
                        <span className="hidden font-bold sm:inline-block">
                            CAMPNAV
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link href="/explore" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Explore
                        </Link>
                        <Link href="/saved" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Saved
                        </Link>
                        <Link href="/trips" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Trips
                        </Link>
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Search could go here */}
                    </div>
                    <nav className="flex items-center">
                        <ModeToggle />
                        <Button variant="ghost" className="ml-2" asChild>
                            <Link href="/login">Login</Link>
                        </Button>
                    </nav>
                </div>
            </div>
        </header>
    )
}
