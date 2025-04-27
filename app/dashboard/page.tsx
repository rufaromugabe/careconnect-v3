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

        // Get the role directly from user metadata or from auth context
        const role = user.user_metadata?.role || await getUserRole()

        if (role) {
          console.log("Dashboard redirect - Role found:", role)
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
        if (attempts > 2 && user?.user_metadata?.role) {
          console.log("Dashboard redirect - Using role from metadata after failures:", user.user_metadata.role)
          router.push(`/${user.user_metadata.role}/dashboard`)
        }
      }
    }

    redirectToDashboard()
  }, [router, user, getUserRole, attempts])

  if (isRedirecting || isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Redirecting to your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Redirect Error</AlertTitle>
        <AlertDescription>{error || "An error occurred during redirection"}</AlertDescription>
      </Alert>
      <div className="mt-4 flex space-x-4">
        <Button variant="outline" onClick={() => router.push("/")}>
          Go back to home
        </Button>
        <Button onClick={() => setAttempts((prev) => prev + 1)}>Try again</Button>
      </div>
    </div>
  )
}
