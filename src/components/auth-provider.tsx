"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useConvex } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

export type AuthUser = {
  _id: Id<"users">
  name: string
  email: string
  image?: string
  points?: number
  role?: string
  roomNumber?: string
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (input: { email: string; password?: string }) => Promise<void>
  logout: () => void
  setUser: (user: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = "campnav:user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const convex = useConvex()

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser
        setUser(parsed)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  function parseUA(ua: string) {
    const browser =
      /Edg\//.test(ua) ? "Edge" :
      /OPR\/|Opera/.test(ua) ? "Opera" :
      /Chrome\//.test(ua) ? "Chrome" :
      /Firefox\//.test(ua) ? "Firefox" :
      /Safari\//.test(ua) ? "Safari" : "Unknown"
    const os =
      /Windows NT/.test(ua) ? "Windows" :
      /Mac OS X/.test(ua) ? "macOS" :
      /Android/.test(ua) ? "Android" :
      /iPhone|iPad/.test(ua) ? "iOS" :
      /Linux/.test(ua) ? "Linux" : "Unknown"
    const device =
      /iPhone/.test(ua) ? "iPhone" :
      /iPad/.test(ua) ? "iPad" :
      /Android/.test(ua) ? "Android" :
      /Mobile/.test(ua) ? "Mobile" : "Desktop"
    return { browser, os, device }
  }

  const login = useCallback(
    async (input: { email: string; password?: string }) => {
      setLoading(true)
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""
      const { browser, os, device } = parseUA(ua)
      let ip: string | undefined
      try { ip = await fetch("https://api64.ipify.org?format=json").then(r => r.json()).then(d => d.ip) } catch { }

      try {
        const dbUser = await convex.query(api.users.verifyUser, {
          email: input.email,
          password: input.password || ""
        })

        if (!dbUser) {
          await convex.mutation(api.loginLogs.log, {
            email: input.email, app: "client", status: "failed",
            ipAddress: ip, userAgent: ua, browser, os, device,
          })
          throw new Error("Invalid email or password")
        }

        const mapped: AuthUser = {
          _id: dbUser._id,
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.imageUrl || undefined,
          points: dbUser.points || 0,
          role: dbUser.role,
          roomNumber: dbUser.roomNumber,
        }
        setUser(mapped)
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
        }

        await convex.mutation(api.loginLogs.log, {
          userId: dbUser._id,
          email: dbUser.email,
          userName: dbUser.name,
          role: dbUser.role,
          app: "client",
          status: "success",
          ipAddress: ip,
          userAgent: ua,
          browser,
          os,
          device,
        })
      } finally {
        setLoading(false)
      }
    },
    [convex],
  )

  const logout = useCallback(() => {
    setUser(null)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const updateUser = useCallback((updatedUser: AuthUser) => {
    setUser(updatedUser)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser))
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser: updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
