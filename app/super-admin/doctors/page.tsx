"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Loader2, PlusCircle, Trash2, Search, UserIcon as UserMd } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { logAction } from "@/lib/logging"
import { toast } from 'react-toastify';

interface Doctor {
  id: string
  user_id: string
  name: string
  email: string
  specialization: string
  license_number: string
  hospital_id: string | null
  hospital_name?: string
  created_at: string
  is_verified: boolean
}

interface Hospital {
  id: string
  name: string
}

export default function SuperAdminDoctorsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    specialization: "",
    license_number: "",
    hospital_id: "",
  })
  const [token, setToken] = useState<string | null>(null)

  // Get the auth token
  useEffect(() => {
    async function getToken() {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (accessToken) {
        setToken(accessToken)
      }
    }
    getToken()
  }, [])

  // Load doctors and hospitals data
  useEffect(() => {
    async function loadData() {
      if (!user || !token) return

      try {
        setLoading(true)

        // First, check if the user has the super-admin role in their metadata
        const isSuperAdmin = user.user_metadata?.role === "super-admin"

        if (!isSuperAdmin) {
          throw new Error("Unauthorized: User is not a super admin")
        }

        // Fetch doctors using the admin API endpoint
        const doctorsResponse = await fetch("/api/admin/doctors", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!doctorsResponse.ok) {
          const errorData = await doctorsResponse.json().catch(() => ({}))
          console.error("API response error:", doctorsResponse.status, errorData)
          throw new Error(errorData.error || `API error: ${doctorsResponse.status}`)
        }

        const doctorsData = await doctorsResponse.json()
        setDoctors(doctorsData)

        // Fetch hospitals for the dropdown
        const hospitalsResponse = await fetch("/api/admin/hospitals", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!hospitalsResponse.ok) {
          const errorData = await hospitalsResponse.json().catch(() => ({}))
          console.error("API response error:", hospitalsResponse.status, errorData)
          throw new Error(errorData.error || `API error: ${hospitalsResponse.status}`)
        }

        const hospitalsData = await hospitalsResponse.json()
        setHospitals(hospitalsData)
      } catch (err: any) {
        console.error("Error loading data:", err)
        setError(err.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, token])

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(
    (doctor) =>
      (doctor.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (doctor.specialization?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (doctor.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  )

  // Handle select input changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle verify doctor
  const handleVerifyDoctor = async (userId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/admin/doctors/${userId}/verify`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to verify doctor")
      }

      const updatedDoctor = await response.json()

      //log action
      await logAction(user?.id || "", "verify-doctor", {
        doctor_id: userId,
        doctor_name: updatedDoctor.name,
        doctor_email: updatedDoctor.email,
      })

      //Refresh UI or update local state as needed
      setDoctors((prev) =>
          prev.map((doctor) =>
              doctor.user_id === userId ? { ...doctor, is_verified: true } : doctor,
          ),
      )
      // Close the dialog
      setIsVerifyDialogOpen(false)
      setCurrentDoctor(null)

      toast.success(`Doctor ${updatedDoctor.name} has been verified successfully.`)
    } catch (err: any) {
      console.error("Error updating doctor verification:", err)
      toast.error(err.message || "Failed to update doctor verification status")
    }
  }

  // Open verify dialog with doctor data
  const openVerifyDialog = (doctor: Doctor) => {
    setCurrentDoctor(doctor)
    setIsVerifyDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="super-admin" />
        <div className="flex-1 flex flex-col">
                <Header title={`Loading `} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading doctors data...</p>
        </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar role="super-admin" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center max-w-md p-6 bg-red-50 rounded-lg">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Data</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-100">
      <Sidebar role="super-admin" />
      <div className="flex-1 flex flex-col">
        <Header title="Doctor Management" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Doctors</h1>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search doctors..."
                    className="pl-8 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>License Number</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead className="text-right">Verification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctors.length > 0 ? (
                      filteredDoctors.map((doctor) => (
                        <TableRow key={doctor.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <UserMd className="h-4 w-4 mr-2 text-blue-500" />
                              {doctor.name}
                            </div>
                          </TableCell>
                          <TableCell>{doctor.email}</TableCell>
                          <TableCell>{doctor.specialization}</TableCell>
                          <TableCell>{doctor.license_number}</TableCell>
                          <TableCell>{doctor.hospital_name || "Not Assigned"}</TableCell>
                          <TableCell className="text-right">
                            {doctor.is_verified ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                                Verified
                              </span>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => openVerifyDialog(doctor)}>
                                Verify
                              </Button>
                            )}
                          </TableCell>
                          
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                          {searchTerm ? "No doctors match your search" : "No doctors found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Verify Doctor Dialog */}
            <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Doctor Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {currentDoctor && (
                    <>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium break-words">{currentDoctor.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium break-all">{currentDoctor.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">License Number</p>
                          <p className="font-medium break-all">{currentDoctor.license_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Hospital</p>
                          <p className="font-medium break-words">{currentDoctor.hospital_name || "Not assigned"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Specialization</p>
                          <p className="font-medium break-words">{currentDoctor.specialization}</p>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-center">
                        <Button
                          onClick={() => handleVerifyDoctor(currentDoctor.user_id)}
                          className="w-full"
                          disabled={currentDoctor.is_verified}
                        >
                          {currentDoctor.is_verified ? "Already Verified" : "Verify Doctor"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}
