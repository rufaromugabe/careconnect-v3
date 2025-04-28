"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Search, Filter, QrCode, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { getPatientProfile, getPatientPrescriptions } from "@/lib/data-service"
import QRCode from "react-qr-code"

export default function PatientPrescriptionsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [patientProfile, setPatientProfile] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)

        // Get patient profile
        const profile = await getPatientProfile(user.id)
        setPatientProfile(profile)

        if (profile) {
          // Get patient's prescriptions
          const prescriptionData = await getPatientPrescriptions(profile.id)
          setPrescriptions(prescriptionData)
        }
      } catch (err: any) {
        console.error("Error loading patient prescriptions:", err)
        setError(err.message || "Failed to load prescriptions")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      (prescription.medications[0]?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || prescription.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="patient" />
        <div className="flex-1 flex flex-col">
                <Header title={`Loading `} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading prescriptions...</p>
        </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar role="patient" />
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
      <Sidebar role="patient" />
      <div className="flex-1 flex flex-col">
        <Header title="My Prescriptions" />
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
                    <TableHead>Medication</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>QR Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.length > 0 ? (
                    filteredPrescriptions.map((prescription) => (
                      <TableRow key={prescription.id}>
                        <TableCell>{prescription.medications[0]?.name || "Unknown"}</TableCell>
                        <TableCell>{prescription.medications[0]?.dosage || "Not specified"}</TableCell>
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
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prescription QR Code</DialogTitle>
            <DialogDescription>Show this QR code at the pharmacy to fill your prescription.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4 space-y-4">
            {/* QR Code for the prescription ID */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              {selectedPrescription && (
                <QRCode value={selectedPrescription.id} size={200} level="H" className="mx-auto" />
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground">Prescription ID: {selectedPrescription?.id}</p>
            <p className="text-center text-sm text-muted-foreground">
              Medication: {selectedPrescription?.medications[0]?.name || "Unknown"}
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
