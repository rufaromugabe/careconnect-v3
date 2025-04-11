"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Search, Plus, MoreVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Activity, Thermometer, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getDoctorProfile, getHealthRecords, getDoctorPatients } from "@/lib/data-service"
import { supabase } from "@/lib/supabase"
import { encrypt } from "@/lib/encryption" // Import encrypt directly

export default function HealthRecordsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<any>(null)
  const [healthRecords, setHealthRecords] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [selectedVitalSigns, setSelectedVitalSigns] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewRecordDialogOpen, setIsNewRecordDialogOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)

        // Get doctor profile
        const profile = await getDoctorProfile(user.id)
        setDoctorProfile(profile)

        if (profile) {
          // Get health records
          const healthRecordData = await getHealthRecords({ doctor_id: profile.id })
          setHealthRecords(healthRecordData)

          // Get doctor's patients
          const patientData = await getDoctorPatients(profile.id)
          setPatients(patientData)
        }
      } catch (err: any) {
        console.error("Error loading health records data:", err)
        setError(err.message || "Failed to load health records data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Filter health records based on search term
  const filteredHealthRecords = healthRecords.filter((record) => {
    const patientName =
      record.patients?.users?.user_metadata?.full_name ||
      record.patients?.users?.user_metadata?.name ||
      record.patients?.users?.email ||
      ""
    const diagnosisName = record.diagnosis_name || ""

    return (
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diagnosisName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Handle form submission
  const handleCreateHealthRecord = async (formData) => {
    if (!doctorProfile) return

    try {
      setFormError(null)

      // Create new health record with directly encrypted sensitive fields
      const newRecord = {
        patient_id: formData.patientId,
        doctor_id: doctorProfile.id,
        diagnosis_name: formData.diagnosisName,
        diagnosis_description: formData.diagnosisDescription ? encrypt(formData.diagnosisDescription) : "",
        diagnosis_severity: formData.diagnosisSeverity,
        visit_date: formData.visitDate,
        notes: formData.notes ? encrypt(formData.notes) : "",
      }

      console.log("Creating encrypted health record:", {
        ...newRecord,
        diagnosis_description: newRecord.diagnosis_description ? "ENCRYPTED" : "",
        notes: newRecord.notes ? "ENCRYPTED" : "",
      })

      // Insert the health record
      const { error: recordError } = await supabase.from("health_records").insert(newRecord)

      if (recordError) throw recordError

      // Refresh health records
      const healthRecordData = await getHealthRecords({ doctor_id: doctorProfile.id })
      setHealthRecords(healthRecordData)

      // Close dialog
      setIsNewRecordDialogOpen(false)
    } catch (err: any) {
      console.error("Error creating health record:", err)
      setFormError(err.message || "Failed to create health record")
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="doctor" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading health records data...</p>
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
          title="Health Records"
          actions={
            <Button onClick={() => setIsNewRecordDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Record
            </Button>
          }
        />
        <main className="flex-1 overflow-y-auto bg-muted/50">
          <div className="container mx-auto p-6">
            <Card className="mb-8">
              <div className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search health records..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Visit Date</TableHead>
                    <TableHead>Vital Signs</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHealthRecords.length > 0 ? (
                    filteredHealthRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.patients?.users?.user_metadata?.full_name ||
                            record.patients?.users?.user_metadata?.name ||
                            record.patients?.users?.email ||
                            "Unknown Patient"}
                        </TableCell>
                        <TableCell>{record.diagnosis_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.diagnosis_severity === "low"
                                ? "default"
                                : record.diagnosis_severity === "medium"
                                  ? "warning"
                                  : "destructive"
                            }
                          >
                            {record.diagnosis_severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(record.visit_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {record.vital_signs && record.vital_signs.length > 0 ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 cursor-pointer"
                              onClick={() => setSelectedVitalSigns(record.vital_signs)}
                            >
                              <Activity className="h-3 w-3 mr-1" /> Recorded
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50">
                              <Thermometer className="h-3 w-3 mr-1" /> Not Recorded
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{record.notes}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No health records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </main>
      </div>

      {/* Dialog for viewing vital signs */}
      <Dialog open={!!selectedVitalSigns} onOpenChange={() => setSelectedVitalSigns(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vital Signs</DialogTitle>
            <DialogDescription>Detailed vital signs information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedVitalSigns?.map((vs, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date Recorded</p>
                    <p>{new Date(vs.recorded_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Temperature</p>
                    <p>{vs.temperature}°C</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Blood Pressure</p>
                    <p>
                      {vs.systolic}/{vs.diastolic} mmHg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recorded By</p>
                    <p>
                      {vs.users?.user_metadata?.full_name || vs.users?.user_metadata?.name || `ID: ${vs.recorded_by}`}
                    </p>
                  </div>
                </div>
                {vs.notes && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p>{vs.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for creating new health record */}
      <Dialog open={isNewRecordDialogOpen} onOpenChange={setIsNewRecordDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Health Record</DialogTitle>
            <DialogDescription>Add a new health record for a patient. You can add vital signs later.</DialogDescription>
          </DialogHeader>
          <HealthRecordForm
            onSubmit={handleCreateHealthRecord}
            patients={patients}
            setIsNewRecordDialogOpen={setIsNewRecordDialogOpen}
            formError={formError}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HealthRecordForm({ onSubmit, patients, setIsNewRecordDialogOpen, formError }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    patientId: "",
    diagnosisName: "",
    diagnosisDescription: "",
    diagnosisSeverity: "low",
    visitDate: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="patientId">Patient</Label>
          <Select name="patientId" onValueChange={(value) => handleSelectChange("patientId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.users?.user_metadata?.full_name ||
                    patient.users?.user_metadata?.name ||
                    patient.users?.email ||
                    `Patient ID: ${patient.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="diagnosisName">Diagnosis</Label>
          <Input
            id="diagnosisName"
            name="diagnosisName"
            value={formData.diagnosisName}
            onChange={handleChange}
            placeholder="Enter diagnosis"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="diagnosisDescription">Diagnosis Description</Label>
          <Textarea
            id="diagnosisDescription"
            name="diagnosisDescription"
            value={formData.diagnosisDescription}
            onChange={handleChange}
            placeholder="Enter diagnosis description"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="diagnosisSeverity">Severity</Label>
          <Select
            name="diagnosisSeverity"
            defaultValue={formData.diagnosisSeverity}
            onValueChange={(value) => handleSelectChange("diagnosisSeverity", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="visitDate">Visit Date</Label>
          <Input type="date" id="visitDate" name="visitDate" value={formData.visitDate} onChange={handleChange} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Enter any additional notes"
          />
        </div>
        {formError && <div className="text-sm font-medium text-destructive">{formError}</div>}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setIsNewRecordDialogOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save Record"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
