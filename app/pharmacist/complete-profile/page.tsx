"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface Pharmacy {
  id: string
  name: string
  location: string
}

export default function PharmacistCompleteProfilePage() {
  const { user, refreshSession } = useAuth() // Changed from refreshUser to refreshSession
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [loadingPharmacies, setLoadingPharmacies] = useState(true)
  const [existingProfile, setExistingProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    license_number: "",
    pharmacy_id: "",
  })

  // Fetch pharmacies for selection
  useEffect(() => {
    async function fetchPharmacies() {
      try {
        setLoadingPharmacies(true)
        const { data, error } = await supabase.from("pharmacies").select("*")

        if (error) {
          throw error
        }

        setPharmacies(data || [])
      } catch (error: any) {
        console.error("Error fetching pharmacies:", error.message)
        toast({
          title: "Error",
          description: "Failed to load pharmacies. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoadingPharmacies(false)
      }
    }

    fetchPharmacies()
  }, [toast])

  // Check if pharmacist profile already exists
  useEffect(() => {
    async function checkExistingProfile() {
      if (!user) return

      try {
        const { data, error } = await supabase.from("pharmacists").select("*").eq("user_id", user.id).single()

        if (error) {
          if (error.code !== "PGRST116") {
            // PGRST116 is the "no rows returned" error
            console.error("Error checking existing profile:", error)
          }
          return
        }

        if (data) {
          setExistingProfile(data)
          setFormData({
            license_number: data.license_number || "",
            pharmacy_id: data.pharmacy_id || "",
          })
        }
      } catch (error) {
        console.error("Error checking existing profile:", error)
      }
    }

    checkExistingProfile()
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      pharmacy_id: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete your profile",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Prepare the pharmacist data
      const pharmacistData = {
        user_id: user.id,
        license_number: formData.license_number,
        pharmacy_id: formData.pharmacy_id === "none" ? null : formData.pharmacy_id,
      }

      let profileError

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase.from("pharmacists").update(pharmacistData).eq("id", existingProfile.id)

        profileError = error
      } else {
        // Create new pharmacist profile
        const { error } = await supabase.from("pharmacists").insert([pharmacistData])

        profileError = error
      }

      if (profileError) {
        throw profileError
      }

      // Update user metadata to mark profile as completed
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          profile_completed: true,
        },
      })

      if (updateError) {
        throw updateError
      }

      // Refresh session to update user metadata
      await refreshSession()

      toast({
        title: "Profile Completed",
        description: "Your pharmacist profile has been set up successfully.",
      })

      // Redirect to dashboard
      router.push("/pharmacist/dashboard")
    } catch (error: any) {
      console.error("Error completing profile:", error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Pharmacist Profile</CardTitle>
          <CardDescription>Please provide your professional information to complete your profile.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                name="license_number"
                placeholder="Enter your pharmacy license number"
                value={formData.license_number}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pharmacy">Pharmacy Affiliation</Label>
              {loadingPharmacies ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading pharmacies...</span>
                </div>
              ) : (
                <Select value={formData.pharmacy_id} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pharmacy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Pharmacy Affiliation</SelectItem>
                    {pharmacies.map((pharmacy) => (
                      <SelectItem key={pharmacy.id} value={pharmacy.id}>
                        {pharmacy.name} - {pharmacy.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : existingProfile ? (
                "Update Profile"
              ) : (
                "Complete Profile"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
