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

interface Nurse {
  id: string
  user_id: string
  name: string
  email: string
  license_number: string
  department: string
  hospital_id: string | null
  hospital_name?: string
  created_at: string
  is_verified: boolean
}

interface Hospital {
  id: string
  name: string
}

export default function SuperAdminNursesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nurses, setNurses] = useState<Nurse[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [currentNurse, setCurrentNurse] = useState<Nurse | null>(null)

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

  // Load nurses and hospitals data
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

        // Fetch nurses using the admin API endpoint
        const nursesResponse = await fetch("/api/admin/nurses", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!nursesResponse.ok) {
          const errorData = await nursesResponse.json().catch(() => ({}))
          console.error("API response error:", nursesResponse.status, errorData)
          throw new Error(errorData.error || `API error: ${nursesResponse.status}`)
        }

        const nursesData = await nursesResponse.json()
        setNurses(nursesData)

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

  // Filter nurses based on search term
  const filteredNurses = nurses.filter(
    (nurse) =>
      (nurse.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (nurse.department?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (nurse.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  )


  // Handle verify nurse
  const handleVerifyNurse = async (userId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/admin/nurses/${userId}/verify`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to verify nurse")
      }

      const updatedNurse = await response.json()

      //log action
      if (user) {
        await logAction(user.id, "verify-nurse", {
          nurse_id: userId,
          nurse_name: updatedNurse.name,
          nurse_email: updatedNurse.email,
        })
      }

      //Refresh UI or update local state as needed
      setNurses((prev) =>
          prev.map((nurse) =>
              nurse.user_id === userId ? { ...nurse, is_verified: true } : nurse,
          ),
      )
      // Close the dialog
      setIsVerifyDialogOpen(false)
      setCurrentNurse(null)

      toast.success(`Nurse ${updatedNurse.name} has been verified successfully.`)
    } catch (err: any) {
      console.error("Error updating nurse verification:", err)
      toast.error(err.message || "Failed to update nurse verification status")
    }
  }



  // Open verify dialog with nurse data
  const openVerifyDialog = (nurse: Nurse) => {
    setCurrentNurse(nurse)
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
          <p className="mt-4 text-lg">Loading nurses data...</p>
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
        <Header title="Nurse Management" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Nurses</h1>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search nurses..."
                    className="pl-8 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Nurses</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>License Number</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead className="text-right">Verification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNurses.length > 0 ? (
                      filteredNurses.map((nurse) => (
                        <TableRow key={nurse.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <UserMd className="h-4 w-4 mr-2 text-blue-500" />
                              {nurse.name}
                            </div>
                          </TableCell>
                          <TableCell>{nurse.email}</TableCell>
                          <TableCell>{nurse.license_number}</TableCell>
                          <TableCell>{nurse.department}</TableCell>
                          <TableCell>{nurse.hospital_name || "Not Assigned"}</TableCell>
                          <TableCell className="text-right">
                            {nurse.is_verified ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                                Verified
                              </span>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => openVerifyDialog(nurse)}>
                                Verify
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                          {searchTerm ? "No nurses match your search" : "No nurses found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Verify Nurse Dialog */}
            <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nurse Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {currentNurse && (
                    <>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium break-words">{currentNurse.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium break-all">{currentNurse.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">License Number</p>
                          <p className="font-medium break-all">{currentNurse.license_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Hospital</p>
                          <p className="font-medium break-words">{currentNurse.hospital_name || "Not assigned"}</p>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-center">
                        <Button
                          onClick={() => handleVerifyNurse(currentNurse.user_id)}
                          className="w-full"
                          disabled={currentNurse.is_verified}
                        >
                          {currentNurse.is_verified ? "Already Verified" : "Verify Nurse"}
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
