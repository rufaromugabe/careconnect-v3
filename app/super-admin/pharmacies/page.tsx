"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Loader2, PlusCircle, Pencil, Trash2, Search, Store } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"

interface Pharmacy {
  id: string
  name: string
  location: string
  created_at: string
}

export default function SuperAdminPharmaciesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentPharmacy, setCurrentPharmacy] = useState<Pharmacy | null>(null)
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

  // Load pharmacies data
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

        // Fetch pharmacies using the admin API endpoint
        const response = await fetch("/api/admin/pharmacies", {
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
        setPharmacies(data)
      } catch (err: any) {
        console.error("Error loading pharmacies data:", err)
        setError(err.message || "Failed to load pharmacies data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, token])

  // Filter pharmacies based on search term
  const filteredPharmacies = pharmacies.filter(
    (pharmacy) =>
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle create pharmacy
  const handleCreatePharmacy = async (e: React.FormEvent) => {
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
      const response = await fetch("/api/admin/pharmacies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create pharmacy")
      }

      const newPharmacy = await response.json()

      // Update the pharmacies list
      setPharmacies((prev) => [...prev, newPharmacy])

      // Reset form and close dialog
      setFormData({ name: "", location: "" })
      setIsAddDialogOpen(false)

      toast({
        title: "Success",
        description: "Pharmacy created successfully",
      })
    } catch (err: any) {
      console.error("Error creating pharmacy:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to create pharmacy",
        variant: "destructive",
      })
    }
  }

  // Handle edit pharmacy
  const handleEditPharmacy = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPharmacy || !token) return

    try {
      const response = await fetch(`/api/admin/pharmacies/${currentPharmacy.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update pharmacy")
      }

      const updatedPharmacy = await response.json()

      // Update the pharmacies list
      setPharmacies((prev) => prev.map((pharmacy) => (pharmacy.id === updatedPharmacy.id ? updatedPharmacy : pharmacy)))

      // Reset form and close dialog
      setCurrentPharmacy(null)
      setFormData({ name: "", location: "" })
      setIsEditDialogOpen(false)

      toast({
        title: "Success",
        description: "Pharmacy updated successfully",
      })
    } catch (err: any) {
      console.error("Error updating pharmacy:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update pharmacy",
        variant: "destructive",
      })
    }
  }

  // Handle delete pharmacy
  const handleDeletePharmacy = async () => {
    if (!currentPharmacy || !token) return

    try {
      const response = await fetch(`/api/admin/pharmacies/${currentPharmacy.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete pharmacy")
      }

      // Update the pharmacies list
      setPharmacies((prev) => prev.filter((pharmacy) => pharmacy.id !== currentPharmacy.id))

      // Reset and close dialog
      setCurrentPharmacy(null)
      setIsDeleteDialogOpen(false)

      toast({
        title: "Success",
        description: "Pharmacy deleted successfully",
      })
    } catch (err: any) {
      console.error("Error deleting pharmacy:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete pharmacy",
        variant: "destructive",
      })
    }
  }

  // Open edit dialog with pharmacy data
  const openEditDialog = (pharmacy: Pharmacy) => {
    setCurrentPharmacy(pharmacy)
    setFormData({
      name: pharmacy.name,
      location: pharmacy.location,
    })
    setIsEditDialogOpen(true)
  }

  // Open delete dialog with pharmacy data
  const openDeleteDialog = (pharmacy: Pharmacy) => {
    setCurrentPharmacy(pharmacy)
    setIsDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="super-admin" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading pharmacies data...</p>
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
        <Header title="Pharmacy Management" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Pharmacies</h1>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search pharmacies..."
                    className="pl-8 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Pharmacy
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Pharmacy</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreatePharmacy} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Pharmacy Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create Pharmacy</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Pharmacies</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pharmacy Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPharmacies.length > 0 ? (
                      filteredPharmacies.map((pharmacy) => (
                        <TableRow key={pharmacy.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Store className="h-4 w-4 mr-2 text-green-500" />
                              {pharmacy.name}
                            </div>
                          </TableCell>
                          <TableCell>{pharmacy.location}</TableCell>
                          <TableCell>{new Date(pharmacy.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(pharmacy)}>
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800"
                                onClick={() => openDeleteDialog(pharmacy)}
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
                          {searchTerm ? "No pharmacies match your search" : "No pharmacies found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit Pharmacy Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Pharmacy</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditPharmacy} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Pharmacy Name</Label>
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
                    <Button type="submit">Update Pharmacy</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete Pharmacy Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p>Are you sure you want to delete {currentPharmacy?.name}?</p>
                  <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeletePharmacy}>
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
