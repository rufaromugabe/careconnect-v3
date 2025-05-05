"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Search, Plus, MoreVertical, Filter, Download, Printer, QrCode, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { getDoctorProfile, getPrescriptions } from "@/lib/data-service"
import QRCode from "react-qr-code"

// Define interfaces for type safety
interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface UserMetadata {
  full_name?: string;
  name?: string;
}

interface User {
  user_metadata: UserMetadata;
}

interface Patient {
  users: User;
}

interface Prescription {
  id: string;
  status: "pending" | "filled" | "canceled";
  notes?: string;
  created_at: string;
  updated_at: string;
  doctor_id: string;
  patient_id: string;
  medications: Medication[];
  patients?: Patient;
}

interface DoctorProfile {
  id: string;
  license_number: string;
  specialization: string;
  hospital_id: string;
  user_id: string;
  users?: User;
}

export default function PrescriptionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Function to load prescriptions data
  const loadPrescriptions = async (doctorId: string) => {
    if (!doctorId || isRefreshing) return

    try {
      setIsRefreshing(true)
      const data = await getPrescriptions({ doctor_id: doctorId })
      setPrescriptions(data as Prescription[])
    } catch (err) {
      console.error("Error refreshing prescriptions:", err)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)

        // Get doctor profile
        const profile = await getDoctorProfile(user.id)
        setDoctorProfile(profile as DoctorProfile)

        if (profile) {
          // Get prescriptions using the existing getPrescriptions function
          await loadPrescriptions(profile.id)
        }
      } catch (err: unknown) {
        console.error("Error loading prescriptions data:", err)
        setError(err instanceof Error ? err.message : "Failed to load prescriptions data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    // Check if any medication name matches the search term
    const medicationMatches =
      prescription.medications?.some((med: Medication) => med.name.toLowerCase().includes(searchTerm.toLowerCase())) || false

    const patientName =
      prescription.patients?.users?.user_metadata?.full_name || prescription.patients?.users?.user_metadata?.name || ""

    const matchesSearch =
      medicationMatches ||
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || prescription.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="doctor" />
        <div className="flex-1 flex flex-col">
                <Header title={`Loading `} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading prescriptions data...</p>
        </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar role="doctor" />
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
    <div className="flex h-screen">
      <Sidebar role="doctor" />
      <div className="flex-1 flex flex-col">
        <Header
          title="Prescriptions"
          actions={
            <>
              <Button variant="outline">
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button onClick={() => router.push("/doctor/prescriptions/create")}>
                <Plus className="mr-2 h-4 w-4" /> New Prescription
              </Button>
            </>
          }
        />
        <main className="flex-1 overflow-y-auto bg-muted/50">
          <div className="container mx-auto p-6">
            <Card className="mb-8">
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search prescriptions..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="filled">Filled</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prescription No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Medications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.length > 0 ? (
                    filteredPrescriptions.map((prescription, i) => (
                      <TableRow key={prescription.id}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>
                          {prescription.patients?.users?.user_metadata?.full_name ||
                            prescription.patients?.users?.user_metadata?.name ||
                            "Unknown Patient"}
                        </TableCell>
                        <TableCell>
                          {prescription.medications && prescription.medications.length > 0 ? (
                            <div>
                              <span>{prescription.medications[0].name}</span>
                              {prescription.medications.length > 1 && (
                                <Badge variant="outline" className="ml-2">
                                  +{prescription.medications.length - 1} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              prescription.status === "pending"
                                ? "default"
                                : prescription.status === "filled"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {prescription.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(prescription.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedPrescription(prescription)}>
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No prescriptions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-xl">

          <DialogHeader>
            <DialogTitle>Prescription QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4 space-y-4">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              {selectedPrescription && (
                <QRCode value={selectedPrescription.id} size={200} level="H" className="mx-auto" />
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground">Prescription ID: {selectedPrescription?.id}</p>
            <p className="text-center text-sm text-muted-foreground">
              Patient:{" "}
              {selectedPrescription?.patients?.users?.user_metadata?.full_name ||
                selectedPrescription?.patients?.users?.user_metadata?.name ||
                "Unknown Patient"}
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Date: {selectedPrescription?.created_at && new Date(selectedPrescription.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setSelectedPrescription(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
