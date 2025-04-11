"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DashboardRedirect() {
  const router = useRouter()
  const { getUserRole, isLoading, user, session } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(true)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    const redirectToDashboard = async () => {
      try {
        console.log("Dashboard redirect - Starting redirect process")

        // If no user is logged in, redirect to login
        if (!user) {
          console.log("Dashboard redirect - No user, redirecting to login")
          router.push("/")
          return
        }

        console.log("Dashboard redirect - User authenticated:", user.id)
        setIsRedirecting(true)

        // Try to get the role from cookie first
        const roleCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("user_role="))
          ?.split("=")[1]

        if (roleCookie) {
          console.log("Dashboard redirect - Using role from cookie:", roleCookie)
          router.push(`/${roleCookie}/dashboard`)
          return
        }

        console.log("Dashboard redirect - No role cookie found, calling getUserRole")
        // If no cookie, try to get the role from the auth context
        const role = await getUserRole()

        if (role) {
          console.log("Dashboard redirect - Redirecting to role dashboard:", role)
          router.push(`/${role}/dashboard`)
        } else {
          console.log("Dashboard redirect - No role found, redirecting to role selection")
          // If no role is found, redirect to role selection
          router.push("/auth/select-role")
        }
      } catch (err) {
        console.error("Dashboard redirect - Error during redirect:", err)
        setError("Failed to determine your role. Please try logging in again.")
        setIsRedirecting(false)

        // Increment attempts counter
        setAttempts((prev) => prev + 1)

        // If we've tried multiple times and still failing, check if we can use user metadata
        if (attempts >= 2 && user?.user_metadata?.role) {
          console.log(
            "Dashboard redirect - Using role from user metadata after failed attempts:",
            user.user_metadata.role,
          )
          router.push(`/${user.user_metadata.role}/dashboard`)
        }
      }
    }

    if (!isLoading) {
      redirectToDashboard()
    }
  }, [router, getUserRole, isLoading, user, attempts])

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-full max-w-md p-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/")}>
              Return to Login
            </Button>
            <Button
              onClick={() => {
                setError(null)
                setIsRedirecting(true)
                router.push("/auth/select-role")
              }}
            >
              Select Role
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg">Redirecting to your dashboard...</p>
        {attempts > 0 && <p className="text-sm text-muted-foreground mt-2">Attempt {attempts + 1}... Please wait</p>}
      </div>
    </div>
  )
}
