import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function WelcomePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Gradient top shape */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-10 px-6 text-center">
        <div className="mt-6 space-y-6">
          <div className="mx-auto h-40 w-40 rounded-3xl bg-card shadow-sm shadow-primary/10" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              CampNav
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Welcome to campnav, we are a dedicated management platform.
            </p>
          </div>
        </div>

        <div className="w-full space-y-3 pb-10">
          <Button className="w-full h-12 rounded-full text-base font-semibold shadow-lg shadow-primary/25" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
