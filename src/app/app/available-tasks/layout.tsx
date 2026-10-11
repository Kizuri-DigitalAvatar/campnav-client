import type { ReactNode } from "react"
import { StaffOnly } from "@/components/staff-only"

export default function AvailableTasksLayout({ children }: { children: ReactNode }) {
    return <StaffOnly>{children}</StaffOnly>
}
