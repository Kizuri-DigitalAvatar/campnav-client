"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { StaffOnly } from "@/components/staff-only"

// The task list is staff-only. Task detail pages redirect residents to the
// matching request themselves, since only the page knows which request that is.
export default function AssignmentsLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    if (pathname !== "/app/assignments") return <>{children}</>
    return <StaffOnly>{children}</StaffOnly>
}
