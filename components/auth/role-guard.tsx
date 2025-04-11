"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
    }

    const checkRole = async () => {
      try {
        // First check if we have the role in a cookie
        const roleCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("user_role="))
          ?.split("=")[1]

        // Quick check with cookie
        if (roleCookie) {
          const hasAccess = roleCookie === requiredRole || roleCookie === "super-admin"
          if (hasAccess) {
            setAuthorized(true)
            return
          }
        }

        // If no cookie or no access, do a full check
        const hasRequiredRole = await hasRole(requiredRole)
        setAuthorized(hasRequiredRole)

        if (!hasRequiredRole) {
          router.push("/unauthorized")
        }
      } catch (error) {
        console.error("Error checking role:", error)
        // If there's an error checking the role, redirect to login
        router.push("/")
      }
    }

    if (!isLoading) {
      checkRole()
    }
  }, [hasRole, requiredRole, router, isLoading, user, isProfileCompleted, path])

  if (isLoading || authorized === null) {
    return (
      fallback || (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    )
  }

  return authorized ? <>{children}</> : null
}
