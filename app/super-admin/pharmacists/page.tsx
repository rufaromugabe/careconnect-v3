"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, Search, UserIcon as UserMd } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { logAction } from "@/lib/logging"
import { toast } from 'react-toastify';

interface Pharmacist {
  id: string
  user_id: string
  name: string
  email: string
  license_number: string
  pharmacy_id: string | null
  pharmacy_name: string | null
  created_at: string
  is_verified: boolean
}

interface Pharmacy {
  id: string
  name: string
}

export default function SuperAdminPharmacistsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([])
  const [pharmacy, setPharmacy] = useState<Pharmacy[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentPharmacist, setcurrentPharmacist] = useState<Pharmacist | null>(null)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)

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

  // Load pharmacists and pharmacy data
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

        // Fetch pharmacists using the admin API endpoint
        const pharmacistsResponse = await fetch("/api/admin/pharmacists", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!pharmacistsResponse.ok) {
          const errorData = await pharmacistsResponse.json().catch(() => ({}))
          console.error("API response error:", pharmacistsResponse.status, errorData)
          throw new Error(errorData.error || `API error: ${pharmacistsResponse.status}`)
        }

        const pharmacistsData = await pharmacistsResponse.json()
        setPharmacists(pharmacistsData)

        // Fetch pharmacy for the dropdown
        const pharmacyResponse = await fetch("/api/admin/pharmacies", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!pharmacyResponse.ok) {
          const errorData = await pharmacyResponse.json().catch(() => ({}))
          console.error("API response error:", pharmacyResponse.status, errorData)
          throw new Error(errorData.error || `API error: ${pharmacyResponse.status}`)
        }

        const pharmacyData = await pharmacyResponse.json()
        setPharmacy(pharmacyData)
      } catch (err: any) {
        console.error("Error loading data:", err)
        setError(err.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, token])

  // Filter pharmacists based on search term
  const filteredpharmacists = pharmacists.filter(
    (pharmacist) =>
      (pharmacist.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (pharmacist.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  )

  const handleVerifyPharmacist = async (userId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/admin/usersVerification/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_verified: true }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to verify pharmacist")
      }

      const updatedPharmacist = await response.json()

      //log action
      if (user) {
        await logAction(user.id, "verify-pharmacist", {
          pharmacist_id: userId,
          pharmacist_name: updatedPharmacist.name,
          pharmacist_email: updatedPharmacist.email,
        })
      }

      //Refresh UI or update local state as needed
      setPharmacists((prev) =>
          prev.map((pharmacist) =>
          pharmacist.user_id === userId ? { ...pharmacist, is_verified: true } : pharmacist,
          ),
      )
      // Close the dialog
      setIsVerifyDialogOpen(false)
      setcurrentPharmacist(null)

      toast.success(`Pharmacist ${updatedPharmacist.name} has been verified successfully.`)
    } catch (err: any) {
      console.error("Error updating pharmacist verification:", err)
      toast.error(err.message || "Failed to update pharmacist verification status")
    }
  }

  const openVerifyDialog = (pharmacist: Pharmacist) => {
    setcurrentPharmacist(pharmacist)
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
          <p className="mt-4 text-lg">Loading pharmacists data...</p>
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
        <Header title="pharmacist Management" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Pharmacists</h1>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search pharmacists..."
                    className="pl-8 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All pharmacists</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>License Number</TableHead>
                      <TableHead>Pharmacy</TableHead>
                      <TableHead className="text-right">Verification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredpharmacists.length > 0 ? (
                      filteredpharmacists.map((pharmacist) => (
                        <TableRow key={pharmacist.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <UserMd className="h-4 w-4 mr-2 text-blue-500" />
                              {pharmacist.name}
                            </div>
                          </TableCell>
                          <TableCell>{pharmacist.email}</TableCell>
                          <TableCell>{pharmacist.license_number}</TableCell>
                          <TableCell>{pharmacist.pharmacy_name || "Not Assigned"}</TableCell>
                          <TableCell className="text-right">
                            {pharmacist.is_verified ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                                Verified
                              </span>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => openVerifyDialog(pharmacist)}>
                                Verify
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                          {searchTerm ? "No Pharmacists match your search" : "No Pharmacists found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-xl">
                <DialogHeader>
                  <DialogTitle>Pharmacist Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {currentPharmacist && (
                    <>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium break-words">{currentPharmacist.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium break-all">{currentPharmacist.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">License Number</p>
                          <p className="font-medium break-all">{currentPharmacist.license_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Pharmacy</p>
                          <p className="font-medium break-words">{currentPharmacist.pharmacy_name || "Not assigned"}</p>
                        </div>
                      </div>
                      <div className="py-4">
                  <p>
                    Are you sure you want to verify pharmacist <strong>{currentPharmacist?.name}</strong>?
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    This will grant them access to perform pharmacist-specific tasks.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => currentPharmacist?.user_id? handleVerifyPharmacist(currentPharmacist.user_id) : null}
                  >
                    Verify
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
