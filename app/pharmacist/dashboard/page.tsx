"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { FileText, CheckCircle, XCircle, Package, Loader2, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/contexts/auth-context"
import { getPharmacistProfile, getPharmacyInventory, getPrescriptions } from "@/lib/data-service"
import { supabase } from "@/lib/supabase"
import { QRScanner } from "@/components/qr-scanner"
import { toast } from 'react-toastify';

export default function PharmacistDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pharmacistProfile, setPharmacistProfile] = useState<any>(null)
  const [pharmacy, setPharmacy] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [scannedPrescription, setScannedPrescription] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)

        // Get pharmacist profile
        const profile = await getPharmacistProfile(user.id)
        setPharmacistProfile(profile)

        if (profile && profile.pharmacy_id) {
          // Get pharmacy details
          const { data: pharmacyData, error: pharmacyError } = await supabase
            .from("pharmacies")
            .select("*")
            .eq("id", profile.pharmacy_id)
            .single()

          if (pharmacyError) throw pharmacyError
          setPharmacy(pharmacyData)

          // Get pharmacy inventory
          const inventoryData = await getPharmacyInventory(profile.pharmacy_id)
          setInventory(inventoryData)

          // Get prescriptions
          const prescriptionData = await getPrescriptions({ status: "pending" })
          setPrescriptions(prescriptionData)
        }
      } catch (err: any) {
        console.error("Error loading pharmacist dashboard data:", err)
        setError(err.message || "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const handleScanQRCode = async (data: string) => {
    try {
      // Close the scanner
      setShowScanner(false)

      // The QR code should contain the prescription ID
      const prescriptionId = data.trim()

      // Check if the prescription exists in our current list
      let prescription = prescriptions.find((p) => p.id === prescriptionId)

      if (!prescription) {
        // If not found in current list, fetch it from the database
        setLoading(true)
        const { data, error } = await supabase
          .from("prescriptions")
          .select(`
            id,
            status,
            notes,
            created_at,
            updated_at,
            doctor_id,
            patient_id,
            medications (
              id,
              name,
              dosage,
              frequency,
              duration
            )
          `)
          .eq("id", prescriptionId)
          .single()

        if (error) throw error

        if (!data) {
          toast("Pescription Not Found")
           
          return
        }

        // Get patient data
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("user_id")
          .eq("id", data.patient_id)
          .single()

        if (patientError) throw patientError

        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(patientData.user_id)
        if (userError) throw userError

        prescription = {
          ...data,
          patients: {
            id: data.patient_id,
            users: userData.user,
          },
        }
      }

      // Show the prescription details
      setScannedPrescription(prescription)
      toast.error('Prescription  loaded successfully')
     
    } catch (err) {
      console.error("Error processing QR code:", err)
      toast.error("Failed to process the QR code")
     
    } finally {
      setLoading(false)
    }
  }

  const updatePrescriptionStatus = async (id: string, status: "pending" | "filled" | "canceled") => {
    try {
      await updatePrescriptionStatus(id, status)

      // Update local state
      setPrescriptions(prescriptions.filter((p) => p.id !== id))
      setScannedPrescription(null)
      toast(`Prescription ${status === "filled" ? "filled" : "canceled"} successfully`)
      
    } catch (err) {
      console.error("Error updating prescription status:", err)
      toast("Failed to update prescription status")
      
    }
  }

  // Calculate stats
  const stats = [
    {
      label: "Pending Prescriptions",
      value: prescriptions.filter((p) => p.status === "pending").length,
      icon: FileText,
      color: "bg-amber-500",
    },
    {
      label: "Filled Today",
      value: prescriptions.filter(
        (p) => p.status === "filled" && new Date(p.updated_at).toDateString() === new Date().toDateString(),
      ).length,
      icon: CheckCircle,
      color: "bg-emerald-500",
    },
    {
      label: "Canceled",
      value: prescriptions.filter((p) => p.status === "canceled").length,
      icon: XCircle,
      color: "bg-rose-500",
    },
    {
      label: "Inventory Items",
      value: inventory.length,
      icon: Package,
      color: "bg-blue-500",
    },
  ]

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="pharmacist" />
        <div className="flex-1 flex flex-col">
                <Header title={`Loading `} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading dashboard data...</p>
        </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar role="pharmacist" />
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
    <div className="flex h-screen bg-background">
      <Sidebar role="pharmacist" />
      <div className="flex-1 flex flex-col">
        <Header
          title="Pharmacist Dashboard"
          actions={
            <Button onClick={() => setShowScanner(true)}>
              <QrCode className="mr-2 h-4 w-4" />
              Scan Prescription
            </Button>
          }
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <Card className="p-6 mb-8 bg-white shadow-lg rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Pharmacy Information</h2>
              <p className="text-gray-600">
                <strong>Name:</strong> {pharmacy?.name || "Not assigned to a pharmacy"}
              </p>
              <p className="text-gray-600">
                <strong>Location:</strong> {pharmacy?.location || "N/A"}
              </p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card
                    key={stat.label}
                    className={`p-6 ${stat.color} text-white shadow-lg rounded-lg transform hover:scale-105 transition-transform duration-200`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <p className="text-sm opacity-90">{stat.label}</p>
                  </Card>
                )
              })}
            </div>

            <Card className="p-6 mb-8 bg-white shadow-lg rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Scan Prescription</h3>
              <p className="mb-4 text-gray-600">Scan a patient's prescription QR code to view and update its status.</p>
              <Button onClick={() => setShowScanner(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
                <QrCode className="mr-2 h-4 w-4" />
                Scan QR Code
              </Button>
            </Card>

            <Card className="p-6 bg-primary-foreground shadow-lg rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Inventory</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.length > 0 ? (
                    inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.description || "No description"}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No inventory items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            {scannedPrescription && (
              <Card className="mt-8 p-6 bg-primary-foreground shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Scanned Prescription</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-gray-700">Patient:</p>
                    <p className="text-gray-600">
                      {scannedPrescription.patients?.users?.user_metadata?.full_name ||
                        scannedPrescription.patients?.users?.user_metadata?.name ||
                        "Unknown Patient"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Medication:</p>
                    <p className="text-gray-600">{scannedPrescription.medications?.[0]?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Dosage:</p>
                    <p className="text-gray-600">{scannedPrescription.medications?.[0]?.dosage || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Status:</p>
                    <p className="text-gray-600">{scannedPrescription.status}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <Button
                    onClick={() => updatePrescriptionStatus(scannedPrescription.id, "filled")}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    disabled={scannedPrescription.status !== "pending"}
                  >
                    Mark as Filled
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updatePrescriptionStatus(scannedPrescription.id, "canceled")}
                    className="bg-rose-500 hover:bg-rose-600 text-white"
                    disabled={scannedPrescription.status !== "pending"}
                  >
                    Cancel Prescription
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* QR Code Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Prescription QR Code</DialogTitle>
            <DialogDescription>
              Point your camera at a prescription QR code to retrieve the prescription details.
            </DialogDescription>
          </DialogHeader>
          <QRScanner onScan={handleScanQRCode} onClose={() => setShowScanner(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
