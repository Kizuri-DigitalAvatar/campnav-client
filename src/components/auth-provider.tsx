"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useConvex, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

export type AuthUser = {
  _id: Id<"users">
  name: string
  email: string
  image?: string
  points?: number
  role?: string
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

  const login = useCallback(
    async (input: { email: string; password?: string }) => {
      setLoading(true)
      try {
        const dbUser = await convex.query(api.users.verifyUser, {
          email: input.email,
          password: input.password || ""
        })

        if (!dbUser) {
          throw new Error("Invalid email or password")
        }

        const mapped: AuthUser = {
          _id: dbUser._id,
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.imageUrl || undefined,
          points: dbUser.points || 0,
          role: dbUser.role,
        }
        setUser(mapped)
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
        }
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
