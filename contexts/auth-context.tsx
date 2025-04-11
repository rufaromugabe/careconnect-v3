"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

// Add the signInWithGoogle function to the AuthContextType interface
type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any; session: Session | null }>
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any; data: any }>
  signOut: () => Promise<void>
  getUserRole: () => Promise<string | null>
  signInWithGoogle: () => Promise<{ error: any }>
  isSupabaseInitialized: boolean
  refreshSession: () => Promise<Session | null>
  persistSession: (session: Session) => void
  hasRole: (role: string) => Promise<boolean>
  isProfileCompleted: () => boolean
  refreshRoleCookie: (userId: string) => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Add a utility function for cookie management
const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === "undefined") return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`
}

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(";").shift()!)
  return null
}

const clearCookie = (name: string) => {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}

export function AuthProvider({
  children,
  initialRole,
}: {
  children: React.ReactNode
  initialRole?: string
}) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSupabaseInitialized, setIsSupabaseInitialized] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(initialRole || null)
  const router = useRouter()
  const { toast } = useToast()

  // Optimized function to refresh role cookie with caching
  const refreshRoleCookie = useCallback(async (userId: string): Promise<string | null> => {
    console.log("Auth context - Refreshing role for user:", userId)

    // Clear existing role cookie
    clearCookie("user_role")

    try {
      // Try to get role from user metadata first (fastest)
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (!userError && userData?.user?.user_metadata?.role) {
        const metadataRole = userData.user.user_metadata.role
        console.log("Auth context - Got role from user metadata:", metadataRole)
        setUserRole(metadataRole)
        setCookie("user_role", metadataRole)
        return metadataRole
      }

      // Then try database with direct query (second fastest)
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).single()

      if (!error && data?.role) {
        console.log("Auth context - Got role from database:", data.role)
        setUserRole(data.role)
        setCookie("user_role", data.role)
        return data.role
      }

      if (error) {
        console.log("Auth context - Database query error:", error.message)

        // Last resort: API call (slowest but most reliable)
        try {
          const response = await fetch("/api/auth/get-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
            cache: "no-store",
          })

          if (response.ok) {
            const result = await response.json()
            if (result.role) {
              console.log("Auth context - Got role from API:", result.role)
              setUserRole(result.role)
              setCookie("user_role", result.role)
              return result.role
            }
          }
        } catch (apiError) {
          console.error("Auth context - API fetch error:", apiError)
        }
      }

      console.log("Auth context - No role found for user")
      return null
    } catch (error) {
      console.error("Auth context - Error in refreshRoleCookie:", error)
      return null
    }
  }, [])

  // Optimized function to persist session
  const persistSession = useCallback(
    async (session: Session) => {
      try {
        console.log("Auth context - Persisting session")

        // Set session cookies
        setCookie("supabase-auth-session-active", "true")
        setCookie("sb-user-id", session.user.id)

        // Get role if not already in state
        if (!userRole) {
          return await refreshRoleCookie(session.user.id)
        }

        return userRole
      } catch (error) {
        console.error("Auth context - Error persisting session:", error)
        return null
      }
    },
    [userRole, refreshRoleCookie],
  )

  // Optimized session refresh function
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Error refreshing session:", error)
        return null
      }

      if (data.session) {
        setSession(data.session)
        setUser(data.session.user)
        await persistSession(data.session)
      }

      return data.session
    } catch (error) {
      console.error("Error refreshing session:", error)
      return null
    }
  }, [persistSession])

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("Auth context - Initializing session")
        setIsLoading(true)

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth context - Session error:", error)
          if (error.message.includes("supabaseUrl is required")) {
            setIsSupabaseInitialized(false)
            toast({
              title: "Configuration Error",
              description: "The application is not properly configured. Please check environment variables.",
              variant: "destructive",
            })
          }
          setIsLoading(false)
          return
        }

        console.log("Auth context - Session exists:", !!session)
        if (session) {
          setSession(session)
          setUser(session.user)

          // Use initial role if provided
          if (initialRole) {
            setUserRole(initialRole)
            console.log("Auth context - Using initial role:", initialRole)
            setCookie("user_role", initialRole)
          } else {
            // Check for role in cookies first
            const roleCookie = getCookie("user_role")
            if (roleCookie) {
              setUserRole(roleCookie)
              console.log("Auth context - Using role from cookie:", roleCookie)
            } else {
              // Refresh role if not in cookie
              await refreshRoleCookie(session.user.id)
            }
          }

          await persistSession(session)
        }
      } catch (error) {
        console.error("Auth context - Error initializing auth:", error)
        setIsSupabaseInitialized(false)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth context - Auth state changed, event:", _event)
      console.log("Auth context - New session exists:", !!session)

      if (_event === "SIGNED_IN") {
        // Clear existing role data
        clearCookie("user_role")
        setUserRole(null)

        if (session) {
          setSession(session)
          setUser(session.user)
          await refreshRoleCookie(session.user.id)
          await persistSession(session)
        }
      } else if (_event === "SIGNED_OUT") {
        // Clear all session data
        setSession(null)
        setUser(null)
        setUserRole(null)
        clearCookie("supabase-auth-session-active")
        clearCookie("user_role")
        clearCookie("sb-user-id")
      } else if (_event === "TOKEN_REFRESHED") {
        // Just update the session
        if (session) {
          setSession(session)
          setUser(session.user)
        }
      }

      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [toast, initialRole, persistSession, refreshRoleCookie])

  // Optimized sign in function
  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseInitialized) {
        return { error: new Error("Authentication system is not properly configured"), session: null }
      }

      try {
        console.log("Auth context - Signing in user:", email)

        // Clear existing cookies
        clearCookie("supabase-auth-session-active")
        clearCookie("user_role")
        clearCookie("sb-user-id")
        setUserRole(null)

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
          },
        })

        if (error) {
          console.error("Auth context - Sign in error:", error)
          return { error, session: null }
        }

        console.log("Auth context - Sign in successful, session exists:", !!data.session)

        if (data.session) {
          setSession(data.session)
          setUser(data.session.user)

          // Get role from user metadata first (fastest)
          if (data.session.user.user_metadata?.role) {
            const role = data.session.user.user_metadata.role
            setUserRole(role)
            setCookie("user_role", role)
          } else {
            // Otherwise refresh role
            await refreshRoleCookie(data.session.user.id)
          }

          await persistSession(data.session)
        }

        return { error: null, session: data.session }
      } catch (error) {
        console.error("Auth context - Sign in error:", error)
        return { error, session: null }
      }
    },
    [isSupabaseInitialized, persistSession, refreshRoleCookie],
  )

  // Keep the signUp function but optimize it
  const signUp = useCallback(
    async (email: string, password: string, userData: any) => {
      if (!isSupabaseInitialized) {
        return { data: null, error: new Error("Authentication system is not properly configured") }
      }

      try {
        console.log("Auth context - Signing up user:", email)

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: userData.name,
              role: userData.role,
              profile_completed: false,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) throw error
        console.log("Auth context - Sign up successful, user created:", !!data.user)

        // Set the user role if available
        if (userData.role) {
          setUserRole(userData.role)
          setCookie("user_role", userData.role)
        }

        return { data, error: null }
      } catch (error) {
        console.error("Auth context - Sign up error:", error)
        return { data: null, error }
      }
    },
    [isSupabaseInitialized],
  )

  // Optimized sign out function
  const signOut = useCallback(async () => {
    if (!isSupabaseInitialized) {
      router.push("/")
      return
    }

    try {
      console.log("Auth context - Signing out user")
      await supabase.auth.signOut()

      // Clear state
      setSession(null)
      setUser(null)
      setUserRole(null)

      // Clear cookies
      clearCookie("supabase-auth-session-active")
      clearCookie("user_role")
      clearCookie("sb-user-id")

      router.push("/")
    } catch (error) {
      console.error("Auth context - Sign out error:", error)
      router.push("/")
    }
  }, [isSupabaseInitialized, router])

  // Optimized getUserRole function
  const getUserRole = useCallback(async () => {
    console.log("Auth context - getUserRole called")

    // If we have the role in state, return it
    if (userRole) {
      console.log("Auth context - Using cached role from state:", userRole)
      return userRole
    }

    // Check for role in cookies
    const roleCookie = getCookie("user_role")
    if (roleCookie) {
      console.log("Auth context - Using role from cookie:", roleCookie)
      setUserRole(roleCookie)
      return roleCookie
    }

    // If no user is authenticated, return null
    if (!isSupabaseInitialized || !user) {
      console.log("Auth context - No authenticated user, returning null role")
      return null
    }

    // Refresh the role
    return await refreshRoleCookie(user.id)
  }, [userRole, isSupabaseInitialized, user, refreshRoleCookie])

  // Optimized Google sign in
  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseInitialized) {
      return { error: new Error("Authentication system is not properly configured") }
    }

    try {
      console.log("Auth context - Signing in with Google")

      // Clear existing role cookie
      clearCookie("user_role")

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      return { error }
    } catch (error) {
      console.error("Auth context - Google sign in error:", error)
      return { error }
    }
  }, [isSupabaseInitialized])

  // Optimized hasRole function
  const hasRole = useCallback(
    async (requiredRole: string) => {
      // If we have the role in state, use it
      if (userRole) {
        // For super-admin, allow access to all roles
        if (userRole === "super-admin") return true
        return userRole === requiredRole
      }

      if (!isSupabaseInitialized || !user) return false

      try {
        // Check if we have the role in a cookie
        const roleCookie = getCookie("user_role")

        if (roleCookie) {
          // Update our state with the cookie value
          setUserRole(roleCookie)

          // For super-admin, allow access to all roles
          if (roleCookie === "super-admin") return true

          return roleCookie === requiredRole
        }

        // If no cookie, refresh the role
        const role = await refreshRoleCookie(user.id)

        // For super-admin, allow access to all roles
        if (role === "super-admin") return true

        return role === requiredRole
      } catch (error) {
        console.error("Auth context - Check role error:", error)
        return false
      }
    },
    [userRole, isSupabaseInitialized, user, refreshRoleCookie],
  )

  // Keep the isProfileCompleted function
  const isProfileCompleted = useCallback(() => {
    return user?.user_metadata?.profile_completed === true
  }, [user])

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
      getUserRole,
      signInWithGoogle,
      isSupabaseInitialized,
      refreshSession,
      persistSession,
      hasRole,
      isProfileCompleted,
      refreshRoleCookie,
    }),
    [
      user,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
      getUserRole,
      signInWithGoogle,
      isSupabaseInitialized,
      refreshSession,
      persistSession,
      hasRole,
      isProfileCompleted,
      refreshRoleCookie,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
