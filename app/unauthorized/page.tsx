"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { AlertTriangle } from "lucide-react"

export default function UnauthorizedPage() {
  const router = useRouter()
  const { getUserRole } = useAuth()

  useEffect(() => {
    const redirectToDashboard = async () => {
      const role = await getUserRole()
      if (role) {
        setTimeout(() => {
          router.push(`/${role}/dashboard`)
        }, 5000) // Redirect after 5 seconds
      }
    }

    redirectToDashboard()
  }, [router, getUserRole])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <Card className="w-full max-w-md p-8 shadow-xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
            <h1 className="text-3xl font-bold">Unauthorized Access</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page. You'll be redirected to your dashboard in a few seconds.
            </p>
            <div className="flex space-x-4 mt-6">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button
                onClick={async () => {
                  const role = await getUserRole()
                  if (role) {
                    router.push(`/${role}/dashboard`)
                  } else {
                    router.push("/")
                  }
                }}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
