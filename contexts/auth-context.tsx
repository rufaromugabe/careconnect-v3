"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
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

  // New function to refresh role cookie with timeouts and better error handling
  const refreshRoleCookie = async (userId: string): Promise<string | null> => {
    console.log("Auth context - Refreshing role cookie for user:", userId)

    // Clear existing role cookie
    document.cookie = "user_role=; path=/; max-age=0; SameSite=Lax"

    try {
      // First try to get the role from the database with a timeout
      const databaseRolePromise = new Promise<string | null>(async (resolve) => {
        try {
          const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).single()
          
          if (!error && data?.role) {
            console.log("Auth context - Refreshed role from database:", data.role)
            resolve(data.role)
          } else {
            resolve(null)
          }
        } catch (e) {
          console.error("Auth context - Error in database role lookup:", e)
          resolve(null)
        }
      })

      // Set a timeout for the database query
      const roleWithTimeout = Promise.race([
        databaseRolePromise,
        new Promise<null>((resolve) => setTimeout(() => {
          console.log("Auth context - Database role lookup timed out")
          resolve(null)
        }, 3000)) // 3 second timeout
      ])

      // Attempt to get the role from the database first
      const databaseRole = await roleWithTimeout
      if (databaseRole) {
        setUserRole(databaseRole)
        document.cookie = `user_role=${databaseRole}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        return databaseRole
      }

      // If database lookup failed, try API as fallback with a timeout
      const apiRolePromise = new Promise<string | null>(async (resolve) => {
        try {
          const controller = new AbortController()
          const signal = controller.signal
          
          const response = await fetch("/api/auth/get-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
            cache: "no-store",
            signal
          })

          if (response.ok) {
            const result = await response.json()
            if (result.role) {
              console.log("Auth context - Refreshed role from API:", result.role)
              resolve(result.role)
              return
            }
          }
          resolve(null)
        } catch (apiError) {
          console.error("Auth context - API fetch error:", apiError)
          resolve(null)
        }
      })

      // Set a timeout for the API call
      const apiRoleWithTimeout = Promise.race([
        apiRolePromise,
        new Promise<null>((resolve) => setTimeout(() => {
          console.log("Auth context - API role lookup timed out")
          resolve(null)
        }, 3000)) // 3 second timeout
      ])

      // Try to get the role from the API
      const apiRole = await apiRoleWithTimeout
      if (apiRole) {
        setUserRole(apiRole)
        document.cookie = `user_role=${apiRole}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        return apiRole
      }

      // Check user metadata as last resort
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (!userError && userData?.user?.user_metadata?.role) {
          const metadataRole = userData.user.user_metadata.role
          console.log("Auth context - Refreshed role from user metadata:", metadataRole)
          setUserRole(metadataRole)
          document.cookie = `user_role=${metadataRole}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
          return metadataRole
        }
      } catch (metadataError) {
        console.error("Auth context - Error getting role from metadata:", metadataError)
      }

      // If no role found through any method, try to use role from signup data
      // This handles the case during registration when the role might not be in DB yet
      if (user?.user_metadata?.role) {
        const signupRole = user.user_metadata.role
        console.log("Auth context - Using role from signup metadata:", signupRole)
        setUserRole(signupRole)
        document.cookie = `user_role=${signupRole}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        return signupRole
      }

      console.log("Auth context - Could not refresh role, no role found")
      return null
    } catch (error) {
      console.error("Auth context - Error in refreshRoleCookie:", error)
      
      // Fallback to user metadata if everything else fails
      try {
        if (user?.user_metadata?.role) {
          const fallbackRole = user.user_metadata.role
          console.log("Auth context - Fallback to role from user metadata:", fallbackRole)
          setUserRole(fallbackRole)
          document.cookie = `user_role=${fallbackRole}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
          return fallbackRole
        }
      } catch (e) {
        console.error("Auth context - Error in fallback role retrieval:", e)
      }
      
      return null
    }
  }

  // Function to persist session in cookies
  const persistSession = async (session: Session) => {
    try {
      console.log("Auth context - Persisting session in cookies")

      // Set a cookie to indicate active session
      document.cookie = `supabase-auth-session-active=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

      // Store user ID in cookie for comparison
      document.cookie = `sb-user-id=${session.user.id}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

      // Always refresh the role cookie when persisting session
      return await refreshRoleCookie(session.user.id)
    } catch (error) {
      console.error("Auth context - Error persisting session:", error)
      return null
    }
  }

  // Function to refresh the session
  const refreshSession = async () => {
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
  }

  useEffect(() => {
    const setData = async () => {
      try {
        console.log("Auth context - Initializing session")
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

          // If we have an initialRole, use it
          if (initialRole) {
            setUserRole(initialRole)
            console.log("Auth context - Using initial role:", initialRole)
          }

          await persistSession(session)
        }
        setIsLoading(false)
      } catch (error) {
        console.error("Auth context - Error initializing auth:", error)
        setIsSupabaseInitialized(false)
        setIsLoading(false)
      }
    }

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log("Auth context - Auth state changed, event:", _event)
        console.log("Auth context - New session exists:", !!session)

        // Clear existing role data when auth state changes
        if (_event === "SIGNED_IN") {
          // Clear any existing cookies before setting new ones
          document.cookie = "user_role=; path=/; max-age=0; SameSite=Lax"
          setUserRole(null)

          // Refresh role cookie with the latest data
          if (session) {
            await refreshRoleCookie(session.user.id)
          }
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session) {
          await persistSession(session)
        } else {
          // Clear session cookies when logged out
          document.cookie = "supabase-auth-session-active=; path=/; max-age=0; SameSite=Lax"
          document.cookie = "user_role=; path=/; max-age=0; SameSite=Lax"
          document.cookie = "sb-user-id=; path=/; max-age=0; SameSite=Lax"
          setUserRole(null)
        }

        setIsLoading(false)
      })

      setData()

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error("Auth context - Error setting up auth subscription:", error)
      setIsSupabaseInitialized(false)
      setIsLoading(false)
    }
  }, [toast, initialRole])

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseInitialized) {
      return { error: new Error("Authentication system is not properly configured"), session: null }
    }

    try {
      console.log("Auth context - Signing in user:", email)

      // Clear any existing cookies before signing in
      document.cookie = "supabase-auth-session-active=; path=/; max-age=0; SameSite=Lax"
      document.cookie = "user_role=; path=/; max-age=0; SameSite=Lax"
      document.cookie = "sb-user-id=; path=/; max-age=0; SameSite=Lax"
      setUserRole(null)

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        console.error("Auth context - Sign in error:", error)
        return { error, session: null }
      }

      console.log("Auth context - Sign in successful, session exists:", !!data.session)
      setSession(data.session)
      setUser(data.session?.user ?? null)

      if (data.session) {
        // Always refresh the role cookie with the latest data
        await refreshRoleCookie(data.session.user.id)

        // Persist the session
        await persistSession(data.session)
      }

      return { error: null, session: data.session }
    } catch (error) {
      console.error("Auth context - Sign in error:", error)
      return { error, session: null }
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    if (!isSupabaseInitialized) {
      return { data: null, error: new Error("Authentication system is not properly configured") }
    }

    try {
      console.log("Auth context - Signing up user:", email)
      // Simplify the sign-up process and ensure userData is properly formatted
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.name,
            role: userData.role,
          },
        },
      })

      if (error) throw error
      console.log("Auth context - Sign up successful, user created:", !!data.user)

      // Set the user role if available
      if (userData.role) {
        setUserRole(userData.role)
        // Set the role cookie
        document.cookie = `user_role=${userData.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      }

      return { data, error: null }
    } catch (error) {
      console.error("Auth context - Sign up error:", error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    if (!isSupabaseInitialized) {
      router.push("/")
      return
    }

    try {
      console.log("Auth context - Signing out user")
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setUserRole(null)

      // Clear session cookies
      document.cookie = "supabase-auth-session-active=; path=/; max-age=0; SameSite=Lax"
      document.cookie = "user_role=; path=/; max-age=0; SameSite=Lax"
      document.cookie = "sb-user-id=; path=/; max-age=0; SameSite=Lax"

      router.push("/")
    } catch (error) {
      console.error("Auth context - Sign out error:", error)
      router.push("/")
    }
  }

  const getUserRole = async () => {
    console.log("Auth context - getUserRole called")

    // If we already have the role in state, return it
    if (userRole) {
      console.log("Auth context - Using cached role from state:", userRole)
      return userRole
    }

    // Check for role in cookies first
    try {
      const roleCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("user_role="))
        ?.split("=")[1]

      if (roleCookie) {
        console.log("Auth context - Using role from cookie:", roleCookie)
        setUserRole(roleCookie)
        return roleCookie
      } else {
        console.log("Auth context - No role cookie found")
      }
    } catch (cookieError) {
      console.error("Auth context - Error reading role cookie:", cookieError)
    }

    // If no user is authenticated, return null
    if (!isSupabaseInitialized) {
      console.log("Auth context - Supabase not initialized, returning null role")
      return null
    }

    if (!user) {
      console.log("Auth context - No authenticated user, returning null role")
      return null
    }

    // If we get here, we need to refresh the role cookie
    return await refreshRoleCookie(user.id)
  }

  // Add the signInWithGoogle function to the AuthProvider component
  const signInWithGoogle = async () => {
    if (!isSupabaseInitialized) {
      return { error: new Error("Authentication system is not properly configured") }
    }

    try {
      console.log("Auth context - Signing in with Google")

      // Clear any existing cookies before OAuth sign-in
      document.cookie = "user_role=; path=/; max-age=0; SameSite=Lax"

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { error }
    } catch (error) {
      console.error("Auth context - Google sign in error:", error)
      return { error }
    }
  }

  // Add this function to the AuthProvider component
  const hasRole = async (requiredRole: string) => {
    // If we already have the role in state, use it
    if (userRole) {
      // For super-admin, allow access to all roles
      if (userRole === "super-admin") return true
      return userRole === requiredRole
    }

    if (!isSupabaseInitialized || !user) return false

    try {
      // First check if we have the role in a cookie to avoid database query
      const roleCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("user_role="))
        ?.split("=")[1]

      if (roleCookie) {
        // Update our state with the cookie value
        setUserRole(roleCookie)

        // For super-admin, allow access to all roles
        if (roleCookie === "super-admin") return true

        return roleCookie === requiredRole
      }

      // If no cookie, refresh the role cookie
      const role = await refreshRoleCookie(user.id)

      // For super-admin, allow access to all roles
      if (role === "super-admin") return true

      return role === requiredRole
    } catch (error) {
      console.error("Auth context - Check role error:", error)
      return false
    }
  }

  // Add this function to the AuthProvider component
  const isProfileCompleted = () => {
    return user?.user_metadata?.profile_completed === true
  }

  // Add refreshRoleCookie to the context value
  const value = {
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
