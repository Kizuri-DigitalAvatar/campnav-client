"use client"

import Link from "next/link"
import { ChevronLeft, Eye, EyeOff, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export default function LoginPage() {
    const router = useRouter()
    const { login } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    return (
        <div className="min-h-screen flex flex-col p-6 bg-background dot-grid relative overflow-hidden">
            {/* Floating decorative 3D tiles, matching the admin login hero */}
            <div className="absolute top-[12%] left-[8%] w-16 h-16 rounded-2xl tile-3d hidden sm:flex items-center justify-center opacity-80 animate-float" style={{ "--tile-rot": "-8deg" } as React.CSSProperties} aria-hidden="true">
                <Lock className="w-6 h-6 text-primary" />
            </div>
            <div className="absolute bottom-[16%] right-[10%] w-14 h-14 rounded-2xl tile-3d hidden sm:flex items-center justify-center opacity-80 animate-float" style={{ "--tile-rot": "10deg", animationDelay: "-2s" } as React.CSSProperties} aria-hidden="true">
                <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="absolute top-[20%] right-[14%] w-10 h-10 rounded-xl tile-3d hidden sm:block opacity-60 animate-float" style={{ "--tile-rot": "6deg", animationDelay: "-4s" } as React.CSSProperties} aria-hidden="true" />
            <div className="absolute bottom-[22%] left-[12%] w-8 h-8 rounded-lg tile-3d hidden sm:block opacity-60 animate-float" style={{ "--tile-rot": "-12deg", animationDelay: "-1s" } as React.CSSProperties} aria-hidden="true" />

            <div className="mb-6 relative z-10">
                <Button variant="ghost" size="icon" asChild className="rounded-full -ml-2">
                    <Link href="/welcome">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                </Button>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Brand mark */}
                <div className="flex flex-col items-center mb-8 space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl tile-3d-primary text-primary-foreground font-extrabold text-2xl">
                        CN
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight">Sign In</h1>
                        <p className="text-muted-foreground text-sm mt-1">Welcome back to CAMPNAV</p>
                    </div>
                </div>

                <div className="glass-card rounded-3xl p-6 shadow-float">
                <form
                    className="space-y-6"
                    onSubmit={async (e) => {
                        e.preventDefault()
                        if (!email.trim() || !password.trim()) return
                        setError(null)
                        setIsLoading(true)
                        try {
                            await login({
                                email: email.trim(),
                                password: password.trim()
                            })
                            router.push("/")
                        } catch (err: any) {
                            setError(err.message || "Something went wrong")
                        } finally {
                            setIsLoading(false)
                        }
                    }}
                >
                    {error && (
                        <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 rounded-xl bg-card pl-10 shadow-sm"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 rounded-xl bg-card pl-10 pr-10 shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        <div className="text-right">
                            <Link href="#" className="text-xs text-primary font-medium">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <div className="mt-8">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-full text-base font-semibold"
                        >
                            {isLoading ? "Signing In..." : "Sign In"}
                        </Button>
                    </div>
                </form>
                </div>

                <p className="mt-8 text-center text-xs text-muted-foreground tracking-tight">
                    Your camping navigation companion.
                </p>
            </div>
        </div>
    )
}
