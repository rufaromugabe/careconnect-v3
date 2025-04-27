"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole: string
  fallback?: React.ReactNode
}

export function RoleGuard({ children, requiredRole, fallback }: RoleGuardProps) {
  const { hasRole, isLoading, user, isProfileCompleted } = useAuth()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const router = useRouter()
  const path = usePathname()

  // Optimized role check function
  const checkAccess = useCallback(async () => {
    try {
     
      if (user?.user_metadata?.role === requiredRole || user?.user_metadata?.role === "super-admin") {
        setAuthorized(true)
        return
      }

      // If metadata doesn't have the role or it doesn't match, do a full check
      const hasRequiredRole = await hasRole(requiredRole)
      setAuthorized(hasRequiredRole)

      if (!hasRequiredRole) {
        console.log("User doesn't have required role:", requiredRole)
        router.push("/unauthorized")
      }
    } catch (error) {
      console.error("Error checking role:", error)
      // If there's an error checking the role, redirect to login
      router.push("/")
    }
  }, [hasRole, requiredRole, router, user])

  useEffect(() => {
    // If no user is logged in, redirect to login immediately
    if (!isLoading && !user) {
      router.push("/")
      return
    }

    if (!isLoading && user) {
      // Check if profile is completed
      if (!isProfileCompleted() && !path.includes("/complete-profile")) {
        router.push(`/${requiredRole}/complete-profile`)
        return
      }

      // Check role access
      checkAccess()
    }
  }, [isLoading, user, path, requiredRole, router, isProfileCompleted, checkAccess])

  // Show loading state
  if (isLoading || authorized === null) {
    return (
      fallback || (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    )
  }

  // Render children only if authorized
  return authorized ? <>{children}</> : null
}
