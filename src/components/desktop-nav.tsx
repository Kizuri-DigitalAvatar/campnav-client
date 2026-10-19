"use client"

import { useState } from "react"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/components/auth-provider"
import { isWorker } from "@/components/role-guard"
import { ContactSupportDialog } from "@/components/contact-support-dialog"
import { ReceptionContactButtons } from "@/components/reception-contact"
import { CampnavLogo } from "@/components/campnav-logo"
import { NavList } from "@/components/app-nav"

/** Menu footer shared by the desktop sidebar and the mobile menu. */
export function NavFooter() {
    const { user } = useAuth()
    const [supportOpen, setSupportOpen] = useState(false)
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <span className="text-xs font-medium text-muted-foreground">Appearance</span>
                <ModeToggle />
            </div>
            <div className="tile-3d rounded-2xl p-4">
                <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">{user && isWorker(user.role) ? "Staff Support" : "Visitor Support"}</p>
                {user && !isWorker(user.role) && (
                    <div className="mb-2">
                        <ReceptionContactButtons />
                    </div>
                )}
                <button
                    onClick={() => setSupportOpen(true)}
                    className="w-full rounded-lg border bg-card py-2 text-xs font-medium transition-colors hover:bg-muted"
                >
                    Contact Support
                </button>
            </div>
            <ContactSupportDialog open={supportOpen} onClose={() => setSupportOpen(false)} />
        </div>
    )
}

export function DesktopNav() {
    return (
        <aside className="sticky top-0 hidden h-screen w-64 flex-col border-y-0 border-l-0 border-r glass-panel shadow-card md:flex">
            <Link href="/app" className="mb-2 flex items-center gap-3 p-6">
                <CampnavLogo size={38} alt="" />
                <span className="text-xl font-bold tracking-tight">CAMPNAV</span>
            </Link>

            <nav aria-label="Main" className="flex-1 overflow-y-auto px-3">
                <NavList />
            </nav>

            <div className="mt-auto p-4">
                <NavFooter />
            </div>
        </aside>
    )
}
