"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import {
  Search,
  Download,
  Printer,
  QrCode,
  Loader2,
  Check,
  X,
  Eye,
  EyeOff,
  Scan,
  List,
  Receipt,
  ShieldCheck,
  Lock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { getPharmacistProfile, getPrescriptionById } from "@/lib/data-service"
import { supabase } from "@/lib/supabase"
import { QRScanner } from "@/components/qr-scanner"
import { toast } from "react-toastify"
import { AnimatedBeam } from "@/components/ui/animated-beam"
import { logAction } from "@/lib/logging"
import { safeDecrypt, isEncrypted } from "@/lib/encryption"

// Define TypeScript interfaces
interface UserMetadata {
  full_name?: string
  name?: string
}

interface User {
  id?: string
  email?: string
  user_metadata?: UserMetadata
}

interface PharmacistProfile {
  id: string
  user_id: string
  license_number: string
  pharmacy_id: string
  users?: User
  [key: string]: any // For any other properties
}

interface Medication {
  id: string
  name: string
  dosage: string
  frequency?: string
  duration?: string
}

interface PatientData {
  id: string
  user_id: string
  users?: User
}

interface DoctorData {
  id: string
  user_id: string
  users?: User
}

interface Prescription {
  id: string
  status: string
  notes?: string
  created_at: string
  updated_at?: string
  filled_by?: string
  filled_date?: string
  canceled_date?: string
  medications?: Medication[]
  patients?: PatientData
  doctors?: DoctorData
  pharmacists?: PharmacistProfile
}

// Define types for the API responses
interface SupabaseData {
  id: any
  status: any
  notes: any
  created_at: any
  updated_at: any
  filled_by: any
  filled_date: any
  medications: any[]
  patients: { id: any; user_id: any }
  doctors: { id: any; user_id: any }
  pharmacists: { id: any; user_id: any; pharmacy_id: any }
}

export default function PharmacistPrescriptionsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pharmacistProfile, setPharmacistProfile] = useState<PharmacistProfile | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("scan")
  const [showFullInfo, setShowFullInfo] = useState(false)

  // Scanning state
  const [isScanning, setIsScanning] = useState(false)
  const [scannedPrescription, setScannedPrescription] = useState<Prescription | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Receipt dialog
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [receiptPrescription, setReceiptPrescription] = useState<Prescription | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)

        // Get pharmacist profile
        const profile = await getPharmacistProfile(user.id)
        setPharmacistProfile(profile) // Now properly typed

        if (profile) {
          // Get prescriptions
          await loadPrescriptions(profile.id)
        }
      } catch (err: any) {
        console.error("Error loading prescriptions data:", err)
        setError(err.message || "Failed to load prescriptions data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const loadPrescriptions = async (pharmacistId: string) => {
    try {
      // Get the pharmacist's pharmacy_id first
      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from("pharmacists")
        .select("pharmacy_id")
        .eq("id", pharmacistId)
        .single()

      if (pharmacistError) throw pharmacistError
      if (!pharmacistData || !pharmacistData.pharmacy_id) {
        throw new Error("Pharmacist not linked to any pharmacy")
      }

      const pharmacyId = pharmacistData.pharmacy_id

      // Query prescriptions, filtering by status=filled and pharmacist's pharmacy_id
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          id,
          status,
          notes,
          created_at,
          updated_at,
          filled_by,
          filled_date,
          medications(*),
          patients:patient_id (
            id,
            user_id
          ),
          doctors:doctor_id (
            id,
            user_id
          ),
          pharmacists:filled_by (
            id,
            user_id,
            pharmacy_id
          )
        `)
        .eq("status", "filled") // Only show filled prescriptions for privacy
        .not("filled_by", "is", null) // Ensure filled_by is not null
        .eq("pharmacists.pharmacy_id", pharmacyId) // Only show prescriptions linked to this pharmacy
        .order("filled_date", { ascending: false })

      if (error) {
        console.error("Error in loadPrescriptions:", error?.message || JSON.stringify(error))
        throw new Error(error?.message || "Unknown Supabase error")
      }

      if (data && data.length > 0) {
        // Additional filter to ensure we only have prescriptions with valid pharmacist data
        const validPrescriptions = data.filter(
          (prescription: any) =>
            prescription.filled_by && prescription.pharmacists && prescription.pharmacists.pharmacy_id === pharmacyId,
        )

        // Process prescriptions to decrypt notes if encrypted
        const processedPrescriptions = validPrescriptions.map((prescription: any) => {
          // Decrypt notes if they are encrypted
          if (prescription.notes && isEncrypted(prescription.notes)) {
            prescription.notes = safeDecrypt(prescription.notes);
          }
          return prescription;
        });

        const withUserData = await Promise.all(
          processedPrescriptions.map(async (prescription: any) => {
            if (prescription.patients?.user_id) {
              const { data: patientData } = await supabase.auth.admin.getUserById(prescription.patients.user_id)
              prescription.patients.users = patientData?.user
            }
            if (prescription.doctors?.user_id) {
              const { data: doctorData } = await supabase.auth.admin.getUserById(prescription.doctors.user_id)
              prescription.doctors.users = doctorData?.user
            }
            if (prescription.pharmacists?.user_id) {
              const { data: pharmacistData } = await supabase.auth.admin.getUserById(prescription.pharmacists.user_id)
              prescription.pharmacists.users = pharmacistData?.user
            }
            return prescription as Prescription
          }),
        )
        setPrescriptions(withUserData as Prescription[])
      } else {
        setPrescriptions([])
      }
    } catch (err: any) {
      console.error("Error loading prescriptions:", err)
      toast.error("Failed to load prescriptions")
    }
  }

  const handleScan = async (prescriptionId: string) => {
    setIsScanning(false)
    setIsProcessing(true)
    setScanError(null)

    try {
      // Get prescription details
      const prescription = await getPrescriptionById(prescriptionId)

      if (!prescription) {
        throw new Error("Prescription not found")
      }

      // Decrypt notes if they are encrypted
      if (prescription.notes && isEncrypted(prescription.notes)) {
        prescription.notes = safeDecrypt(prescription.notes);
      }

      setScannedPrescription(prescription as Prescription)
      setActiveTab("scan") // Ensure we're on the scan tab
    } catch (err: any) {
      console.error("Error scanning prescription:", err)
      setScanError(err.message || "Failed to scan prescription")
      setScannedPrescription(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpdateStatus = async (prescriptionId: string, newStatus: string) => {
    try {
      setIsProcessing(true)

      const now = new Date().toISOString()
      const updates: Partial<Prescription> = {
        status: newStatus,
        updated_at: now,
      }

      // Add filled_by and filled_date if marking as filled
      if (newStatus === "filled") {
        updates.filled_by = pharmacistProfile?.id
        updates.filled_date = now
      }

      // Add canceled_date if marking as canceled
      if (newStatus === "canceled") {
        updates.canceled_date = now
      }

      const { error } = await supabase.from("prescriptions").update(updates).eq("id", prescriptionId)

      if (error) throw error
      // Log the action
      await logAction(user?.id||"", `filled prescription ${prescriptionId}`, {
        prescription_id: prescriptionId,
        status: newStatus,
        pharmacist_id: pharmacistProfile?.user_id,
        
      })
      // Update local state
      if (scannedPrescription && scannedPrescription.id === prescriptionId) {
        setScannedPrescription({
          ...scannedPrescription,
          status: newStatus,
          filled_by: newStatus === "filled" ? pharmacistProfile?.id : scannedPrescription.filled_by,
          filled_date: newStatus === "filled" ? now : scannedPrescription.filled_date,
          canceled_date: newStatus === "canceled" ? now : scannedPrescription.canceled_date,
        })
      }

      // Refresh prescriptions list
      await loadPrescriptions(pharmacistProfile?.id || "")

      toast.success(
        `Prescription ${newStatus === "filled" ? "filled" : "canceled"} successfully`,
      )
    } catch (err: any) {
      console.error("Error updating prescription status:", err)
      toast.error("Failed to update prescription status",)
    } finally {
      setIsProcessing(false)
    }
  }

  const showReceipt = (prescription: Prescription) => {
    setReceiptPrescription(prescription)
    setShowReceiptDialog(true)
  }

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    // Only include prescriptions that have a valid filled_by pharmacist
    if (!prescription.filled_by || !prescription.pharmacists) {
      return false
    }

    // Check if any medication name matches the search term
    const medicationMatches =
      prescription.medications?.some((med) => med.name.toLowerCase().includes(searchTerm.toLowerCase())) || false

    // Get patient name, handling potential undefined values
    const patientName =
      prescription.patients?.users?.user_metadata?.full_name || prescription.patients?.users?.user_metadata?.name || ""

    // Only filter by search terms - status is already filtered in the query
    return (
      medicationMatches ||
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Helper function to obscure patient name for privacy
  const getObscuredName = (patient?: PatientData) => {
    if (!patient?.users?.user_metadata) return "Unknown Patient"

    const fullName = patient.users.user_metadata.full_name || patient.users.user_metadata.name || ""
    if (!fullName) return "Unknown Patient"

    // If showing full info, return the full name
    if (showFullInfo) return fullName

    // Otherwise, show only initials
    const nameParts = fullName.split(" ")
    return nameParts.map((part) => part.charAt(0) + ".").join(" ")
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="pharmacist" />
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
    <div className="flex h-screen">
      <Sidebar role="pharmacist" />
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
            </>
          }
        />
        <main className="flex-1 overflow-y-auto bg-muted/50">
          <div className="container mx-auto p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <TabsList>
                  <TabsTrigger value="scan" className="flex items-center">
                    <Scan className="mr-2 h-4 w-4" /> Scan Prescription
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex items-center">
                    <List className="mr-2 h-4 w-4" /> View Filled Prescriptions
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center space-x-2">
                  <Switch id="show-full-info" checked={showFullInfo} onCheckedChange={setShowFullInfo} />
                  <Label htmlFor="show-full-info" className="flex items-center cursor-pointer">
                    {showFullInfo ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" /> Hide Patient Info
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" /> Show Full Patient Info
                      </>
                    )}
                  </Label>
                </div>
              </div>

              <TabsContent value="scan" className="space-y-6">
                {!scannedPrescription ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Scan Prescription QR Code</CardTitle>
                      <CardDescription>
                        Scan a prescription QR code to view details and process the prescription.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                      {isScanning ? (
                        <div className="w-full max-w-md mx-auto">
                          <div className="relative overflow-hidden rounded-lg border border-input">
                            <QRScanner
                              onScan={handleScan}
                              onError={(error) => {
                                console.error(error)
                                setScanError("Failed to scan QR code")
                              }}
                              onClose={() => setIsScanning(false)}
                              className="w-full aspect-square"
                            />
                            <AnimatedBeam />
                          </div>
                          <div className="mt-4 text-center">
                            <p className="text-sm text-muted-foreground">
                              Position the QR code within the scanner frame
                            </p>
                            <Button variant="outline" className="mt-2" onClick={() => setIsScanning(false)}>
                              Cancel Scan
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-12">
                          {isProcessing ? (
                            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                          ) : (
                            <QrCode className="h-12 w-12 text-primary mb-4" />
                          )}
                          <h3 className="text-lg font-medium mb-2">
                            {isProcessing ? "Processing..." : "Ready to Scan"}
                          </h3>
                          <p className="text-center text-muted-foreground mb-6 max-w-md">
                            {isProcessing
                              ? "Please wait while we process the prescription..."
                              : "Click the button below to scan a prescription QR code presented by a patient."}
                          </p>
                          {scanError && (
                            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
                              {scanError}
                            </div>
                          )}
                          <Button
                            onClick={() => {
                              setIsScanning(true)
                              setScanError(null)
                            }}
                            disabled={isProcessing}
                          >
                            <Scan className="mr-2 h-4 w-4" /> Start Scanning
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                          <CardTitle>Prescription Details</CardTitle>
                          <CardDescription>Scanned prescription information</CardDescription>
                        </div>
                        <Badge
                          variant={
                            scannedPrescription.status === "pending"
                              ? "default"
                              : scannedPrescription.status === "filled"
                                ? "outline"
                                : "destructive"
                          }
                          className={`ml-auto ${scannedPrescription.status === "filled" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}`}
                        >
                          {scannedPrescription.status.toUpperCase()}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Prescription ID</h3>
                              <p className="font-mono">{scannedPrescription.id}</p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Patient</h3>
                              <div className="flex items-center">
                                <p>{getObscuredName(scannedPrescription.patients)}</p>
                                {!showFullInfo && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2 h-6"
                                    onClick={() => setShowFullInfo(true)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" /> Show
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Prescribed By</h3>
                              <p>
                                {scannedPrescription.doctors?.users?.user_metadata?.full_name ||
                                  scannedPrescription.doctors?.users?.user_metadata?.name ||
                                  "Unknown Doctor"}
                              </p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Date Prescribed</h3>
                              <p>{new Date(scannedPrescription.created_at).toLocaleDateString()}</p>
                            </div>

                            {scannedPrescription.notes && (
                              <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                                  Notes <Lock className="ml-1 h-3 w-3 text-green-600" aria-label="Secure notes">
                                    <title>Secure notes</title>
                                  </Lock>
                                </h3>
                                <p className="text-sm">{scannedPrescription.notes}</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Medications</h3>
                            <div className="space-y-3">
                              {scannedPrescription.medications?.map((medication, index) => (
                                <div key={medication.id} className="p-3 border rounded-md">
                                  <div className="flex justify-between">
                                    <h4 className="font-medium">{medication.name}</h4>
                                  </div>
                                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Dosage:</span> {medication.dosage}
                                    </div>
                                    {medication.frequency && (
                                      <div>
                                        <span className="text-muted-foreground">Frequency:</span> {medication.frequency}
                                      </div>
                                    )}
                                    {medication.duration && (
                                      <div>
                                        <span className="text-muted-foreground">Duration:</span> {medication.duration}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col sm:flex-row gap-3 border-t pt-6">
                        <div className="flex-1 flex justify-start">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setScannedPrescription(null)
                              setScanError(null)
                            }}
                          >
                            Scan Another
                          </Button>
                        </div>
                        <div className="flex gap-3">
                          {scannedPrescription.status === "pending" && (
                            <>
                              <Button
                                variant="destructive"
                                onClick={() => handleUpdateStatus(scannedPrescription.id, "canceled")}
                                disabled={isProcessing}
                              >
                                <X className="mr-2 h-4 w-4" /> Reject
                              </Button>
                              <Button
                                onClick={() => handleUpdateStatus(scannedPrescription.id, "filled")}
                                disabled={isProcessing}
                              >
                                <Check className="mr-2 h-4 w-4" /> Fill Prescription
                              </Button>
                            </>
                          )}
                          {scannedPrescription.status === "filled" && (
                            <Button variant="outline" onClick={() => showReceipt(scannedPrescription)}>
                              <Receipt className="mr-2 h-4 w-4" /> View Receipt
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-6">
                <Card className="mb-6">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search prescriptions..."
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Medications</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Filled Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPrescriptions.length > 0 ? (
                        filteredPrescriptions.map((prescription) => (
                          <TableRow key={prescription.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <ShieldCheck className="h-4 w-4 text-green-500 mr-2" />
                                {getObscuredName(prescription.patients)}
                              </div>
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
                              {prescription.doctors?.users?.user_metadata?.full_name ||
                                prescription.doctors?.users?.user_metadata?.name ||
                                "Unknown Doctor"}
                            </TableCell>
                            <TableCell>
                              {prescription.filled_date
                                ? new Date(prescription.filled_date).toLocaleDateString()
                                : new Date(prescription.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setScannedPrescription(prescription)
                                    setActiveTab("scan")
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => showReceipt(prescription)}>
                                  <Receipt className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No filled prescriptions found for your pharmacy
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-xl">

          <DialogHeader>
            <DialogTitle>Prescription Receipt</DialogTitle>
            <DialogDescription>Details of the filled prescription</DialogDescription>
          </DialogHeader>

          {receiptPrescription && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="border-b pb-2">
                <p className="text-sm text-muted-foreground">Prescription ID</p>
                <p className="font-mono text-sm break-all">{receiptPrescription.id}</p>
              </div>

              <div className="border-b pb-2">
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="break-words">
                  {receiptPrescription.patients?.users?.user_metadata?.full_name ||
                    receiptPrescription.patients?.users?.user_metadata?.name ||
                    "Unknown Patient"}
                </p>
              </div>

              <div className="border-b pb-2">
                <p className="text-sm text-muted-foreground">Prescribed By</p>
                <p className="break-words">
                  {receiptPrescription.doctors?.users?.user_metadata?.full_name ||
                    receiptPrescription.doctors?.users?.user_metadata?.name ||
                    "Unknown Doctor"}
                </p>
              </div>

              <div className="border-b pb-2">
                <p className="text-sm text-muted-foreground">Filled By</p>
                <p className="break-words">
                  {receiptPrescription.pharmacists?.users?.user_metadata?.full_name ||
                    receiptPrescription.pharmacists?.users?.user_metadata?.name ||
                    "Unknown Pharmacist"}
                </p>
              </div>

              <div className="border-b pb-2">
                <p className="text-sm text-muted-foreground">Dates</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Prescribed:</span>{" "}
                    {new Date(receiptPrescription.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Filled:</span>{" "}
                    {receiptPrescription.filled_date
                      ? new Date(receiptPrescription.filled_date).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Medications</p>
                <div className="space-y-2">
                  {receiptPrescription.medications?.map((medication) => (
                    <div key={medication.id} className="p-2 bg-muted rounded-md text-sm">
                      <p className="font-medium break-words">{medication.name}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                        <div className="break-words">
                          <span className="text-muted-foreground">Dosage:</span> {medication.dosage}
                        </div>
                        {medication.frequency && (
                          <div className="break-words">
                            <span className="text-muted-foreground">Frequency:</span> {medication.frequency}
                          </div>
                        )}
                        {medication.duration && (
                          <div className="break-words">
                            <span className="text-muted-foreground">Duration:</span> {medication.duration}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {receiptPrescription.notes && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center">
                    Notes <Lock className="ml-1 h-3 w-3 text-green-600" aria-label="Secure notes">
                      <title>Secure notes</title>
                    </Lock>
                  </p>
                  <p className="text-sm break-words">{receiptPrescription.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowReceiptDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
