"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Search, Thermometer, FileText, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import {
  getNurseProfile,
  getNursePatients,
  addVitalSigns,
  createHealthRecord,
  getHealthRecords,
} from "@/lib/data-service"
import { toast } from "react-toastify"

// Define interfaces for type safety
interface VitalSigns {
  temperature: string
  systolic: string
  diastolic: string
  notes: string
}

interface Patient {
  id: string
  users?: {
    email: string
    user_metadata?: {
      full_name?: string
      name?: string
    }
  }
  doctor_id?: string
  blood_type?: string
}

interface VitalSignsFormProps {
  patient: Patient | null
  onClose: () => void
  onSubmit: (vitalSigns: VitalSigns) => void
}

export default function NursePatientsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nurseProfile, setNurseProfile] = useState<any>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)

        // Get nurse profile
        const profile = await getNurseProfile(user.id)
        setNurseProfile(profile)

        if (profile) {
          // Get nurse's patients
          const patientData = await getNursePatients(profile.id)
          setPatients(patientData)
        }
      } catch (err: any) {
        console.error("Error loading patients data:", err)
        setError(err.message || "Failed to load patients data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const filteredPatients = patients.filter((patient) => {
    const patientName = patient.users?.user_metadata?.full_name || patient.users?.user_metadata?.name || ""
    const patientEmail = patient.users?.email || ""

    return (
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientEmail.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleRecordVitalSigns = async (patientId: string, vitalSigns: VitalSigns) => {
    try {
      // Check if patient has an existing health record
      const healthRecords = await getHealthRecords({ patient_id: patientId })

      let healthRecordId

      // If no health record exists, create one
      if (!healthRecords || healthRecords.length === 0) {
        const newRecord = {
          patient_id: patientId,
          doctor_id: selectedPatient?.doctor_id || null,
          visit_date: new Date().toISOString(),
          diagnosis_name: "Routine Check-up",
          diagnosis_severity: "low",
          notes: "Vital signs recorded by nurse",
        }

        const success = await createHealthRecord(newRecord)
        if (!success) throw new Error("Failed to create health record")

        // Get the newly created health record
        const updatedRecords = await getHealthRecords({ patient_id: patientId })
        healthRecordId = updatedRecords[0].id
      } else {
        healthRecordId = healthRecords[0].id
      }

      // Now add the vital signs
      await addVitalSigns({
        health_record_id: healthRecordId,
        recorded_at: new Date().toISOString(),
        temperature: Number.parseFloat(vitalSigns.temperature),
        systolic: Number.parseInt(vitalSigns.systolic),
        diastolic: Number.parseInt(vitalSigns.diastolic),
        recorded_by: user?.id, // Add null check with optional chaining
        notes: vitalSigns.notes,
      })

      toast.success(
        "Vital signs recorded successfully",
    )

      setSelectedPatient(null)
    } catch (err) {
      console.error("Error recording vital signs:", err)
      toast.error(
      
      "Failed to record vital signs",
     
      )
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="nurse" />
        <div className="flex-1 flex flex-col">
                <Header title={`Loading `} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading patients data...</p>
        </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar role="nurse" />
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
      <Sidebar role="nurse" />
      <div className="flex-1 flex flex-col">
        <Header title="My Patients" />
        <main className="flex-1 overflow-y-auto bg-muted/50">
          <div className="container mx-auto p-6">
            <Card className="mb-8">
              <div className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">
                          {patient.users?.user_metadata?.full_name || patient.users?.user_metadata?.name || "Unknown"}
                        </TableCell>
                        <TableCell>{patient.users?.email || "Unknown"}</TableCell>
                        <TableCell>{patient.blood_type || "Not specified"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedPatient(patient)}>
                              <Thermometer className="h-4 w-4 mr-2" /> Record Vitals
                            </Button>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4 mr-2" /> View Records
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No patients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-xl">

          <DialogHeader>
            <DialogTitle>Record Vital Signs</DialogTitle>
            <DialogDescription>
              Record vital signs for{" "}
              {selectedPatient?.users?.user_metadata?.full_name ||
                selectedPatient?.users?.user_metadata?.name ||
                "this patient"}
              .
            </DialogDescription>
          </DialogHeader>
          <VitalSignsForm
            patient={selectedPatient}
            onClose={() => setSelectedPatient(null)}
            onSubmit={(vitalSigns: VitalSigns) => handleRecordVitalSigns(selectedPatient!.id, vitalSigns)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function VitalSignsForm({ patient, onClose, onSubmit }: VitalSignsFormProps) {
  const [formData, setFormData] = useState<VitalSigns>({
    temperature: "",
    systolic: "",
    diastolic: "",
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <label htmlFor="temperature" className="text-sm font-medium">
            Temperature (°C)
          </label>
          <Input
            id="temperature"
            name="temperature"
            type="number"
            step="0.1"
            value={formData.temperature}
            onChange={handleChange}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label htmlFor="systolic" className="text-sm font-medium">
              Systolic (mmHg)
            </label>
            <Input
              id="systolic"
              name="systolic"
              type="number"
              value={formData.systolic}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="diastolic" className="text-sm font-medium">
              Diastolic (mmHg)
            </label>
            <Input
              id="diastolic"
              name="diastolic"
              type="number"
              value={formData.diastolic}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="grid gap-2">
          <label htmlFor="notes" className="text-sm font-medium">
            Notes
          </label>
          <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}
