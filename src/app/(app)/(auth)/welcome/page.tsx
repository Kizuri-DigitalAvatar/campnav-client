import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tent, Compass, MapPin, Bell, Utensils, Sparkles } from "lucide-react"

export default function WelcomePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background dot-grid">
      {/* Soft glow washes */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary/15 blur-3xl animate-pulse [animation-duration:5s]" />

      {/* Floating 3D tiles drifting around the hero */}
      <div
        className="absolute top-[14%] left-[10%] w-16 h-16 rounded-2xl tile-3d hidden sm:flex items-center justify-center animate-in fade-in zoom-in-50 duration-700 delay-300 fill-mode-backwards"
        aria-hidden="true"
      >
        <div className="animate-float flex items-center justify-center w-full h-full" style={{ "--tile-rot": "-8deg" } as React.CSSProperties}>
          <Tent className="w-7 h-7 text-primary" />
        </div>
      </div>
      <div
        className="absolute top-[18%] right-[12%] w-14 h-14 rounded-2xl tile-3d hidden sm:flex items-center justify-center animate-in fade-in zoom-in-50 duration-700 delay-500 fill-mode-backwards"
        aria-hidden="true"
      >
        <div className="animate-float flex items-center justify-center w-full h-full" style={{ "--tile-rot": "10deg", animationDelay: "-2s" } as React.CSSProperties}>
          <Compass className="w-6 h-6 text-amber-500" />
        </div>
      </div>
      <div
        className="absolute bottom-[22%] left-[14%] w-14 h-14 rounded-2xl tile-3d hidden sm:flex items-center justify-center animate-in fade-in zoom-in-50 duration-700 delay-700 fill-mode-backwards"
        aria-hidden="true"
      >
        <div className="animate-float flex items-center justify-center w-full h-full" style={{ "--tile-rot": "6deg", animationDelay: "-4s" } as React.CSSProperties}>
          <Utensils className="w-5 h-5 text-emerald-500" />
        </div>
      </div>
      <div
        className="absolute bottom-[18%] right-[10%] w-16 h-16 rounded-2xl tile-3d hidden sm:flex items-center justify-center animate-in fade-in zoom-in-50 duration-700 delay-600 fill-mode-backwards"
        aria-hidden="true"
      >
        <div className="animate-float flex items-center justify-center w-full h-full" style={{ "--tile-rot": "-10deg", animationDelay: "-1s" } as React.CSSProperties}>
          <MapPin className="w-6 h-6 text-sky-500" />
        </div>
      </div>
      <div
        className="absolute top-[42%] left-[6%] w-10 h-10 rounded-xl tile-3d hidden md:flex items-center justify-center animate-in fade-in zoom-in-50 duration-700 delay-900 fill-mode-backwards"
        aria-hidden="true"
      >
        <div className="animate-float flex items-center justify-center w-full h-full" style={{ "--tile-rot": "12deg", animationDelay: "-3s" } as React.CSSProperties}>
          <Bell className="w-4 h-4 text-violet-500" />
        </div>
      </div>
      <div
        className="absolute top-[46%] right-[7%] w-8 h-8 rounded-lg tile-3d hidden md:block animate-in fade-in zoom-in-50 duration-700 delay-1000 fill-mode-backwards"
        aria-hidden="true"
      >
        <div className="animate-float w-full h-full" style={{ "--tile-rot": "-14deg", animationDelay: "-5s" } as React.CSSProperties} />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-10 px-6 text-center">
        <div className="mt-6 space-y-8">
          {/* Brand mark — pops in first, then floats gently */}
          <div className="mx-auto w-fit animate-in fade-in zoom-in-75 duration-700">
            <div className="animate-float" style={{ animationDelay: "-1.5s" } as React.CSSProperties}>
              <div className="flex items-center justify-center h-28 w-28 rounded-[2rem] tile-3d-primary text-primary-foreground font-extrabold text-4xl">
                CN
              </div>
            </div>
          </div>

          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] uppercase font-black tracking-[0.25em] text-primary mb-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200 fill-mode-backwards">
              <Sparkles className="w-3 h-3" />
              Welcome to
            </p>
            <h1 className="text-4xl font-black tracking-tighter animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300 fill-mode-backwards">
              CampNav{" "}
              <span className="block text-muted-foreground/50 font-bold text-2xl mt-1">
                your camp, in one place
              </span>
            </h1>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-3 duration-700 delay-500 fill-mode-backwards">
              Services, meals, updates, and support — everything you need for a
              comfortable stay, right at your fingertips.
            </p>
          </div>
        </div>

        <div className="w-full space-y-3 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 fill-mode-backwards">
          <Button className="w-full h-12 rounded-full text-base font-semibold" asChild>
            <Link href="/login">Get Started</Link>
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Sign in with the account provided by your camp manager.
          </p>
        </div>
      </div>
    </div>
  )
}
