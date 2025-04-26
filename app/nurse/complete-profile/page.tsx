"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { toast } from 'react-toastify';

interface Hospital {
  id: string
  name: string
  location: string
}

export default function NurseCompleteProfilePage() {
  const { user, refreshSession } = useAuth() // Changed from refreshUser to refreshSession
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loadingHospitals, setLoadingHospitals] = useState(true)
  const [existingProfile, setExistingProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    license_number: "",
    department: "",
    hospital_id: "",
  })

  // Fetch hospitals for selection
  useEffect(() => {
    async function fetchHospitals() {
      try {
        setLoadingHospitals(true)
        const { data, error } = await supabase.from("hospitals").select("*")

        if (error) {
          throw error
        }

        setHospitals(data || [])
      } catch (error: any) {
        console.error("Error fetching hospitals:", error.message)
        toast.error("Failed to load hospitals. Please try again.");
      } finally {
        setLoadingHospitals(false)
      }
    }

    fetchHospitals()
  }, [toast])

  // Check if nurse profile already exists
  useEffect(() => {
    async function checkExistingProfile() {
      if (!user) return

      try {
        const { data, error } = await supabase.from("nurses").select("*").eq("user_id", user.id).single()

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
            department: data.department || "",
            hospital_id: data.hospital_id || "",
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
      hospital_id: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("You must be logged in to complete your profile")
      return
    }

    try {
      setLoading(true)

      // Prepare the nurse data
      const nurseData = {
        user_id: user.id,
        license_number: formData.license_number,
        department: formData.department,
        hospital_id: formData.hospital_id === "none" ? null : formData.hospital_id,
      }

      let profileError

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase.from("nurses").update(nurseData).eq("id", existingProfile.id)

        profileError = error
      } else {
        // Create new nurse profile
        const { error } = await supabase.from("nurses").insert([nurseData])

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

      toast.success("Profile updated successfully!")

      // Redirect to dashboard
      router.push("/nurse/verify")
    } catch (error: any) {
      console.error("Error completing profile:", error.message)
      toast.error(error.message);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Nurse Profile</CardTitle>
          <CardDescription>Please provide your professional information to complete your profile.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                name="license_number"
                placeholder="Enter your nursing license number"
                value={formData.license_number}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                placeholder="E.g., Emergency, Pediatrics, etc."
                value={formData.department}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hospital">Hospital Affiliation</Label>
              {loadingHospitals ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading hospitals...</span>
                </div>
              ) : (
                <Select value={formData.hospital_id} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Hospital Affiliation</SelectItem>
                    {hospitals.map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.name} - {hospital.location}
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
