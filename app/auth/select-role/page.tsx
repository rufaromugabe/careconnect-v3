"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

export default function SelectRole() {
  const [role, setRole] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!role) {
      toast({
        title: "Please select a role",
        description: "You need to select a role to continue",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in again",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    setIsLoading(true)

    try {
      // Create user role entry
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: role as any,
      })

      if (roleError) {
        console.error("Error creating user role:", roleError)
        throw roleError
      }

      // Create role-specific entry
      if (role === "doctor") {
        await supabase.from("doctors").insert({
          user_id: user.id,
          license_number: "PENDING",
          specialization: "General",
        })
      } else if (role === "nurse") {
        await supabase.from("nurses").insert({
          user_id: user.id,
          license_number: "PENDING",
          department: "General",
        })
      } else if (role === "patient") {
        await supabase.from("patients").insert({
          user_id: user.id,
          dob: new Date().toISOString(),
        })
      } else if (role === "pharmacist") {
        await supabase.from("pharmacists").insert({
          user_id: user.id,
          license_number: "PENDING",
        })
      }

      // Redirect to the appropriate dashboard
      router.push(`/${role}/dashboard`)
    } catch (error) {
      console.error("Error setting role:", error)
      toast({
        title: "Error",
        description: "Failed to set your role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <Heart className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-5xl font-bold tracking-tight">CareConnect</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">Please select your role to continue</p>
        </div>

        <div className="flex justify-center">
          <Card className="w-full max-w-md p-8 shadow-xl">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">Select Your Role</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Select value={role} onValueChange={setRole} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Continue"}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
