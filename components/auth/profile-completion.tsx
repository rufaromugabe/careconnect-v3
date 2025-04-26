"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { toast } from 'react-toastify';

interface ProfileCompletionProps {
  role: "doctor" | "patient" | "pharmacist" | "nurse" | "super-admin"
}

export function ProfileCompletion({ role }: ProfileCompletionProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hospitals, setHospitals] = useState<{ id: string; name: string }[]>([])
  const [pharmacies, setPharmacies] = useState<{ id: string; name: string }[]>([])
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([])
  const [loadingAffiliations, setLoadingAffiliations] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    licenseNumber: "",
    specialization: "",
    department: "",
    hospitalId: "",
    pharmacyId: "",
    doctorId: "",
    dob: "",
    bloodType: "",
    allergies: "",
  })

  // Fetch user data on component mount
  useEffect(() => {
    async function fetchUserData() {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session?.user) {
        const user = sessionData.session.user
        setFormData((prev) => ({
          ...prev,
          fullName: user.user_metadata?.full_name || "",
          email: user.email || "",
        }))
      }
    }

    fetchUserData()
  }, [])

  // Fetch affiliations (hospitals, pharmacies, doctors) based on role
  useEffect(() => {
    async function fetchAffiliations() {
      setLoadingAffiliations(true)
      try {
        // Fetch hospitals for doctors and nurses
        if (role === "doctor" || role === "nurse" || role === "patient") {
          const { data: hospitalsData, error: hospitalsError } = await supabase.from("hospitals").select("id, name")
          if (hospitalsError) throw hospitalsError
          setHospitals(hospitalsData || [])
        }

        // Fetch pharmacies for pharmacists
        if (role === "pharmacist") {
          const { data: pharmaciesData, error: pharmaciesError } = await supabase.from("pharmacies").select("id, name")
          if (pharmaciesError) throw pharmaciesError
          setPharmacies(pharmaciesData || [])
        }

        // Fetch doctors for patients
        if (role === "patient") {
          const { data: doctorsData, error: doctorsError } = await supabase.from("doctors").select("id, name")
          if (doctorsError) throw doctorsError
          setDoctors(doctorsData || [])
        }
      } catch (error) {
        console.error("Error fetching affiliations:", error)
        toast.error("Failed to load affiliations. Please try again.")
      } finally {
        setLoadingAffiliations(false)
      }
    }

    fetchAffiliations()
  }, [role])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session?.user) {
        toast.error("You must be logged in to complete your profile")
        return
      }

      const userId = sessionData.session.user.id

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          gender: formData.gender,
          profile_completed: true,
        },
      })

      if (updateError) throw updateError

      // Create role-specific profile
      if (role === "doctor") {
        const { error: profileError } = await supabase.from("doctors").insert({
          user_id: userId,
          name: formData.fullName,
          email: formData.email,
          license_number: formData.licenseNumber,
          specialization: formData.specialization,
          hospital_id: formData.hospitalId || null,
        })

        if (profileError) throw profileError
      } else if (role === "nurse") {
        const { error: profileError } = await supabase.from("nurses").insert({
          user_id: userId,
          name: formData.fullName,
          email: formData.email,
          license_number: formData.licenseNumber,
          department: formData.department,
          hospital_id: formData.hospitalId || null,
        })

        if (profileError) throw profileError
      } else if (role === "pharmacist") {
        const { error: profileError } = await supabase.from("pharmacists").insert({
          user_id: userId,
          name: formData.fullName,
          email: formData.email,
          license_number: formData.licenseNumber,
          pharmacy_id: formData.pharmacyId || null,
        })

        if (profileError) throw profileError
      } else if (role === "patient") {
        // Parse allergies from string to array
        const allergiesArray = formData.allergies ? formData.allergies.split(",").map((item) => item.trim()) : []

        const { error: profileError } = await supabase.from("patients").insert({
          user_id: userId,
          name: formData.fullName,
          email: formData.email,
          dob: formData.dob,
          blood_type: formData.bloodType,
          allergies: allergiesArray,
          doctor_id: formData.doctorId || null,
        })

        if (profileError) throw profileError
      } else if (role === "super-admin") {
        const { error: profileError } = await supabase.from("super_admins").insert({
          user_id: userId,
          access_level: "full",
          managed_entities: [],
        })

        if (profileError) throw profileError
      }

      toast.success("Profile updated successfully!")

      // Redirect to the appropriate dashboard
      router.push(`/${role}/dashboard`)
    } catch (error: any) {
      console.error("Error completing profile:", error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>Please provide the following information to complete your {role} profile.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Basic Information - Common for all roles */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleSelectChange("gender", value)}
                    required
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Role-specific Information */}
            {role === "doctor" && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Doctor Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="hospitalId">Hospital</Label>
                    <Select
                      value={formData.hospitalId}
                      onValueChange={(value) => handleSelectChange("hospitalId", value)}
                    >
                      <SelectTrigger id="hospitalId">
                        <SelectValue placeholder="Select a hospital" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_assigned">Not Assigned</SelectItem>
                        {hospitals.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id}>
                            {hospital.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {loadingAffiliations && <p className="text-sm text-muted-foreground">Loading hospitals...</p>}
                  </div>
                </div>
              </div>
            )}

            {role === "nurse" && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Nurse Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="hospitalId">Hospital</Label>
                    <Select
                      value={formData.hospitalId}
                      onValueChange={(value) => handleSelectChange("hospitalId", value)}
                    >
                      <SelectTrigger id="hospitalId">
                        <SelectValue placeholder="Select a hospital" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not Assigned</SelectItem>
                        {hospitals.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id}>
                            {hospital.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {loadingAffiliations && <p className="text-sm text-muted-foreground">Loading hospitals...</p>}
                  </div>
                </div>
              </div>
            )}

            {role === "pharmacist" && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Pharmacist Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="pharmacyId">Pharmacy</Label>
                    <Select
                      value={formData.pharmacyId}
                      onValueChange={(value) => handleSelectChange("pharmacyId", value)}
                    >
                      <SelectTrigger id="pharmacyId">
                        <SelectValue placeholder="Select a pharmacy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_assigned">Not Assigned</SelectItem>
                        {pharmacies.map((pharmacy) => (
                          <SelectItem key={pharmacy.id} value={pharmacy.id}>
                            {pharmacy.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {loadingAffiliations && <p className="text-sm text-muted-foreground">Loading pharmacies...</p>}
                  </div>
                </div>
              </div>
            )}

            {role === "patient" && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Patient Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Select
                      value={formData.bloodType}
                      onValueChange={(value) => handleSelectChange("bloodType", value)}
                    >
                      <SelectTrigger id="bloodType">
                        <SelectValue placeholder="Select blood type" />
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
                        <SelectItem value="Unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="allergies">Allergies (comma separated)</Label>
                    <Textarea
                      id="allergies"
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleInputChange}
                      placeholder="e.g., Penicillin, Peanuts, Latex"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="doctorId">Primary Doctor</Label>
                    <Select value={formData.doctorId} onValueChange={(value) => handleSelectChange("doctorId", value)}>
                      <SelectTrigger id="doctorId">
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_assigned">Not Assigned</SelectItem>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {loadingAffiliations && <p className="text-sm text-muted-foreground">Loading doctors...</p>}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing Profile...
                </>
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
