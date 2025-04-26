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

interface Doctor {
  id: string
  specialization: string
  user_id: string
  userData?: {
    full_name?: string
    name?: string
  }
}

export default function PatientCompleteProfilePage() {
  const { user, refreshSession } = useAuth() // Changed from refreshUser to refreshSession
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [existingProfile, setExistingProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    dob: "",
    blood_type: "",
    allergies: "",
    doctor_id: "",
  })

  // Fetch doctors for selection
  useEffect(() => {
    async function fetchDoctors() {
      try {
        setLoadingDoctors(true)
        // First, get the basic doctor data
        const { data, error } = await supabase.from("doctors").select(`
            id,
            specialization,
            user_id
          `)

        if (error) {
          throw error
        }

        // Then, fetch user data for each doctor
        if (data && data.length > 0) {
          const enhancedData = await Promise.all(
            data.map(async (doctor) => {
              try {
                const { data: userData, error: userError } = await supabase.auth.admin.getUserById(doctor.user_id)

                if (userError) {
                  console.error("Error fetching user data for doctor:", userError.message)
                  return {
                    ...doctor,
                    userData: { full_name: "Unknown Doctor" },
                  }
                }

                return {
                  ...doctor,
                  userData: userData.user.user_metadata,
                }
              } catch (err) {
                console.error("Error processing doctor data:", err)
                return {
                  ...doctor,
                  userData: { full_name: "Unknown Doctor" },
                }
              }
            }),
          )
          setDoctors(enhancedData)
        } else {
          setDoctors([])
        }
      } catch (error: any) {
        console.error("Error fetching doctors:", error.message)
        toast.error("Failed to load doctors. Please try again.")
      } finally {
        setLoadingDoctors(false)
      }
    }

    fetchDoctors()
  }, [toast])

  // Check if patient profile already exists
  useEffect(() => {
    async function checkExistingProfile() {
      if (!user) return

      try {
        const { data, error } = await supabase.from("patients").select("*").eq("user_id", user.id).single()

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
            dob: data.dob || "",
            blood_type: data.blood_type || "",
            allergies: Array.isArray(data.allergies) ? data.allergies.join(", ") : "",
            doctor_id: data.doctor_id || "",
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

      // Parse allergies into an array
      const allergiesArray = formData.allergies ? formData.allergies.split(",").map((item) => item.trim()) : []

      // Prepare the patient data
      const patientData = {
        user_id: user.id,
        dob: formData.dob,
        blood_type: formData.blood_type || null,
        allergies: allergiesArray,
        doctor_id: formData.doctor_id === "none" ? null : formData.doctor_id,
      }

      let profileError

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase.from("patients").update(patientData).eq("id", existingProfile.id)

        profileError = error
      } else {
        // Create patient profile
        const { error } = await supabase.from("patients").insert([patientData])

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
      router.push("/patient/dashboard")
    } catch (error: any) {
      console.error("Error completing profile:", error.message)
      toast.error(error.message || "Failed to complete profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get doctor name
  const getDoctorName = (doctor: Doctor) => {
    return doctor.userData?.full_name || doctor.userData?.name || "Unknown Doctor"
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Patient Profile</CardTitle>
          <CardDescription>Please provide your health information to complete your profile.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blood_type">Blood Type</Label>
              <Select value={formData.blood_type} onValueChange={(value) => handleSelectChange("blood_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your blood type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Input
                id="allergies"
                name="allergies"
                placeholder="E.g., Penicillin, Peanuts, etc. (comma separated)"
                value={formData.allergies}
                onChange={handleInputChange}
              />
              <p className="text-xs text-gray-500">Leave blank if none</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor">Primary Doctor</Label>
              {loadingDoctors ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading doctors...</span>
                </div>
              ) : (
                <Select value={formData.doctor_id} onValueChange={(value) => handleSelectChange("doctor_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Primary Doctor</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {getDoctorName(doctor)} - {doctor.specialization}
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
