"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Loader2, PlusCircle, Pencil, Trash2, Search, UserIcon as UserMd } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Doctor {
  id: string
  name: string
  email: string
  specialization: string
  license_number: string
  hospital_id: string | null
  hospital_name?: string
  created_at: string
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
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

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle select input changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle create doctor
  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast({
        title: "Error",
        description: "Authentication token not available",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create doctor")
      }

      const newDoctor = await response.json()

      // Update the doctors list
      setDoctors((prev) => [...prev, newDoctor])

      // Reset form and close dialog
      setFormData({
        name: "",
        email: "",
        specialization: "",
        license_number: "",
        hospital_id: "",
      })
      setIsAddDialogOpen(false)

      toast({
        title: "Success",
        description: "Doctor created successfully",
      })
    } catch (err: any) {
      console.error("Error creating doctor:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to create doctor",
        variant: "destructive",
      })
    }
  }

  // Handle edit doctor
  const handleEditDoctor = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentDoctor || !token) return

    try {
      const response = await fetch(`/api/admin/doctors/${currentDoctor.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update doctor")
      }

      const updatedDoctor = await response.json()

      // Update the doctors list
      setDoctors((prev) => prev.map((doctor) => (doctor.id === updatedDoctor.id ? updatedDoctor : doctor)))

      // Reset form and close dialog
      setCurrentDoctor(null)
      setFormData({
        name: "",
        email: "",
        specialization: "",
        license_number: "",
        hospital_id: "",
      })
      setIsEditDialogOpen(false)

      toast({
        title: "Success",
        description: "Doctor updated successfully",
      })
    } catch (err: any) {
      console.error("Error updating doctor:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update doctor",
        variant: "destructive",
      })
    }
  }

  // Handle delete doctor
  const handleDeleteDoctor = async () => {
    if (!currentDoctor || !token) return

    try {
      const response = await fetch(`/api/admin/doctors/${currentDoctor.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete doctor")
      }

      // Update the doctors list
      setDoctors((prev) => prev.filter((doctor) => doctor.id !== currentDoctor.id))

      // Reset and close dialog
      setCurrentDoctor(null)
      setIsDeleteDialogOpen(false)

      toast({
        title: "Success",
        description: "Doctor deleted successfully",
      })
    } catch (err: any) {
      console.error("Error deleting doctor:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete doctor",
        variant: "destructive",
      })
    }
  }

  // Open edit dialog with doctor data
  const openEditDialog = (doctor: Doctor) => {
    setCurrentDoctor(doctor)
    setFormData({
      name: doctor.name || "",
      email: doctor.email || "",
      specialization: doctor.specialization || "",
      license_number: doctor.license_number || "",
      hospital_id: doctor.hospital_id || "",
    })
    setIsEditDialogOpen(true)
  }

  // Open delete dialog with doctor data
  const openDeleteDialog = (doctor: Doctor) => {
    setCurrentDoctor(doctor)
    setIsDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="super-admin" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading doctors data...</p>
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
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Doctor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Doctor</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateDoctor} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Doctor Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
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
                      <div className="space-y-2">
                        <Label htmlFor="license_number">License Number</Label>
                        <Input
                          id="license_number"
                          name="license_number"
                          value={formData.license_number}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hospital_id">Hospital</Label>
                        <Select
                          value={formData.hospital_id}
                          onValueChange={(value) => handleSelectChange("hospital_id", value)}
                        >
                          <SelectTrigger>
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
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create Doctor</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
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
                      <TableHead className="text-right">Actions</TableHead>
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
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(doctor)}>
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800"
                                onClick={() => openDeleteDialog(doctor)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                          {searchTerm ? "No doctors match your search" : "No doctors found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit Doctor Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Doctor</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditDoctor} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Doctor Name</Label>
                    <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-specialization">Specialization</Label>
                    <Input
                      id="edit-specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-license_number">License Number</Label>
                    <Input
                      id="edit-license_number"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-hospital_id">Hospital</Label>
                    <Select
                      value={formData.hospital_id}
                      onValueChange={(value) => handleSelectChange("hospital_id", value)}
                    >
                      <SelectTrigger>
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
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Update Doctor</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete Doctor Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p>Are you sure you want to delete Dr. {currentDoctor?.name}?</p>
                  <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteDoctor}>
                    Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}
