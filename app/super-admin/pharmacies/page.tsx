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
import { toast } from "react-toastify"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { logAction } from "@/lib/logging"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPharmacy, setCurrentPharmacy] = useState<Pharmacy | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
  })
  const [newPharmacy, setNewPharmacy] = useState({
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
        // log action
        await logAction(user?.id || "", "accessed pharmacies list", {
          email: user?.email || "",
          status: "ok",
        })
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
      toast.error("Authentication token not available")
      return
    }

    try {
      const response = await fetch("/api/admin/pharmacies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPharmacy),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create pharmacy")
      }

      const createdPharmacy = await response.json()
      await logAction(user?.id || "", `created new pharmacy: ${createdPharmacy.name}`, {
        email: user?.email || "",
        status: "created",
        pharmacy_name: createdPharmacy.name,
        pharmacy_location: createdPharmacy.location,
      })
      setPharmacies((prev) => [...prev, createdPharmacy])
      setNewPharmacy({ name: "", location: "" })
      setIsAddDialogOpen(false)

      toast.success("Pharmacy created successfully")
    } catch (err: any) {
      console.error("Error creating pharmacy:", err)
      toast.error(err.message || "Failed to create pharmacy")
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
      await logAction(user?.id || "", `updated pharmacy: ${currentPharmacy.name}`, {
        email: user?.email || "",
        status: "created",
        pharmacy_name: updatedPharmacy.name,
        pharmacy_location: updatedPharmacy.location,
      })
      setPharmacies((prev) => prev.map((pharmacy) => (pharmacy.id === updatedPharmacy.id ? updatedPharmacy : pharmacy)))
      setCurrentPharmacy(null)
      setFormData({ name: "", location: "" })
      setIsEditDialogOpen(false)

      toast.success("Pharmacy updated successfully")
    } catch (err: any) {
      console.error("Error updating pharmacy:", err)
      toast.error(err.message || "Failed to update pharmacy")
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

      await logAction(user?.id || "", `deleted pharmacy: ${currentPharmacy.name}`, {
        email: user?.email || "",
        status: "deleted",
        pharmacy_name: currentPharmacy.name,
        pharmacy_location: currentPharmacy.location,
      })
      setPharmacies((prev) => prev.filter((pharmacy) => pharmacy.id !== currentPharmacy.id))
      setCurrentPharmacy(null)
      setIsDeleteDialogOpen(false)

      toast.success("Pharmacy deleted successfully")
    } catch (err: any) {
      console.error("Error deleting pharmacy:", err)
      toast.error(err.message || "Failed to delete pharmacy")
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
        <div className="flex-1 flex flex-col">
          <Header title={`Loading `} />
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg">Loading pharmacies data...</p>
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
                  <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-xl">
                    <DialogHeader>
                      <DialogTitle>Create New Pharmacy</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      <form onSubmit={handleCreatePharmacy} className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-sm font-medium">
                            Pharmacy Name
                          </label>
                          <Input
                            id="name"
                            value={newPharmacy.name}
                            onChange={(e) => setNewPharmacy({ ...newPharmacy, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="location" className="text-sm font-medium">
                            Location
                          </label>
                          <Input
                            id="location"
                            value={newPharmacy.location}
                            onChange={(e) => setNewPharmacy({ ...newPharmacy, location: e.target.value })}
                            required
                          />
                        </div>
                        {/*<div className="space-y-2">
                          <label htmlFor="phone" className="text-sm font-medium">
                            Phone Number
                          </label>
                          <Input
                            id="phone"
                            value={newPharmacy.phone}
                            onChange={(e) => setNewPharmacy({ ...newPharmacy, phone: e.target.value })}
                            required
                          /> 
                        </div> */}
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" type="button" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                              </>
                            ) : (
                              "Create Pharmacy"
                            )}
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
              <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-xl">
                <DialogHeader>
                  <DialogTitle>Edit Pharmacy</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Pharmacy Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-xl">
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
                  <p className="break-words">Are you sure you want to delete {currentPharmacy?.name}?</p>
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
