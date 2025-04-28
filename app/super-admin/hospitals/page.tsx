"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Loader2, PlusCircle, Pencil, Trash2, Search, Building } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { logAction } from "@/lib/logging"
import { toast } from 'react-toastify';

interface Hospital {
  id: string
  name: string
  location: string
  created_at: string
}

export default function SuperAdminHospitalsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
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

  // Load hospitals data
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

        // Fetch hospitals using the admin API endpoint
        const response = await fetch("/api/admin/hospitals", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("API response error:", response.status, errorData)
          throw new Error(errorData.error || `API error: ${response.status}`)
        }

        const data = await response.json()
        setHospitals(data)
      } catch (err: any) {
        console.error("Error loading hospitals data:", err)
        setError(err.message || "Failed to load hospitals data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, token])

  // Filter hospitals based on search term
  const filteredHospitals = hospitals.filter(
    (hospital) =>
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle create hospital
  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast.error("Authentication token not available")
      return
    }

    try {
      const response = await fetch("/api/admin/hospitals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create hospital")
      }

      const newHospital = await response.json()
      await logAction(
        user?.id || "",
        "created new hospital",
        {
          email: user?.email || "",
          status: "created",
          hospital_name: newHospital.name,
          hospital_location: newHospital.location,
        }
      )
      setHospitals((prev) => [...prev, newHospital])
      setFormData({ name: "", location: "" })
      setIsAddDialogOpen(false)

      toast.success("Hospital created successfully")
    } catch (err: any) {
      console.error("Error creating hospital:", err)
      toast.error(err.message || "Failed to create hospital")
    }
  }

  // Handle edit hospital
  const handleEditHospital = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentHospital || !token) return

    try {
      const response = await fetch(`/api/admin/hospitals/${currentHospital.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update hospital")
      }

      const updatedHospital = await response.json()
      await logAction(
        user?.id || "",
        "updated hospital",
        {
          email: user?.email || "",
          status: "updated",
          hospital_name: updatedHospital.name,
          hospital_location: updatedHospital.location,
        }
      )
      setHospitals((prev) => prev.map((hospital) => (hospital.id === updatedHospital.id ? updatedHospital : hospital)))
      setCurrentHospital(null)
      setFormData({ name: "", location: "" })
      setIsEditDialogOpen(false)

      toast.success("Hospital updated successfully")
    } catch (err: any) {
      console.error("Error updating hospital:", err)
      toast.error(err.message || "Failed to update hospital")
    }
  }

  // Handle delete hospital
  const handleDeleteHospital = async () => {
    if (!currentHospital || !token) return

    try {
      const response = await fetch(`/api/admin/hospitals/${currentHospital.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete hospital")
      }

      await logAction(
        user?.id || "",
        "deleted hospital",
        {
          email: user?.email || "",
          status: "deleted",
          hospital_name: currentHospital.name,
          hospital_location: currentHospital.location,
        }
      )
      setHospitals((prev) => prev.filter((hospital) => hospital.id !== currentHospital.id))
      setCurrentHospital(null)
      setIsDeleteDialogOpen(false)

      toast.success("Hospital deleted successfully")
    } catch (err: any) {
      console.error("Error deleting hospital:", err)
      toast.error(err.message || "Failed to delete hospital")
    }
  }

  // Open edit dialog with hospital data
  const openEditDialog = (hospital: Hospital) => {
    setCurrentHospital(hospital)
    setFormData({
      name: hospital.name,
      location: hospital.location,
    })
    setIsEditDialogOpen(true)
  }

  // Open delete dialog with hospital data
  const openDeleteDialog = (hospital: Hospital) => {
    setCurrentHospital(hospital)
    setIsDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="super-admin" />
        <div className="flex-1 flex flex-col">
                <Header title={`Loading `} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading hospitals data...</p>
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
    <div className="flex h-screen bg-muted/50">
      <Sidebar role="super-admin" />
      <div className="flex-1 flex flex-col">
        <Header title="Hospital Management" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Hospitals</h1>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search hospitals..."
                    className="pl-8 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Hospital
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Hospital</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      <form onSubmit={handleCreateHospital} className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-sm font-medium">
                            Hospital Name
                          </label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="location" className="text-sm font-medium">
                            Location
                          </label>
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            required
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            Create Hospital
                          </Button>
                        </div>
                      </form>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Hospitals</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hospital Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHospitals.length > 0 ? (
                      filteredHospitals.map((hospital) => (
                        <TableRow key={hospital.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-2 text-blue-500" />
                              {hospital.name}
                            </div>
                          </TableCell>
                          <TableCell>{hospital.location}</TableCell>
                          <TableCell>{new Date(hospital.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(hospital)}>
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800"
                                onClick={() => openDeleteDialog(hospital)}
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
                        <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                          {searchTerm ? "No hospitals match your search" : "No hospitals found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit Hospital Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Hospital</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <form onSubmit={handleEditHospital} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Hospital Name</Label>
                      <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-location">Location</Label>
                      <Input
                        id="edit-location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Update Hospital</Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Hospital Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
                  <p className="break-words">Are you sure you want to delete {currentHospital?.name}?</p>
                  <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteHospital}>
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
