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
        <div className="min-h-screen flex flex-col p-6 bg-background relative">
            <div className="mb-6">
                <Button variant="ghost" size="icon" asChild className="rounded-full -ml-2">
                    <Link href="/welcome">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                </Button>
            </div>

            <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
                <h1 className="text-2xl font-bold mb-8 text-center">Sign In</h1>

                <form
                    className="space-y-6 flex-1"
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
                            className="w-full h-12 rounded-full text-base font-semibold shadow-lg shadow-primary/25"
                        >
                            {isLoading ? "Signing In..." : "Sign In"}
                        </Button>
                    </div>
                </form>

                {/* Bottom Decoration */}
                <div className="mt-auto -mx-6 -mb-6 h-32 bg-[url('/wave.svg')] bg-no-repeat bg-cover opacity-20 relative pointer-events-none">
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-orange-400/20 to-transparent rounded-t-[50%]"></div>
                </div>
            </div>
        </div>
    )
}
