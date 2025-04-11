"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Search, Plus, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import {
  getNurseProfile,
  getNursePatients,
  getVitalSigns,
  addVitalSigns,
  createHealthRecord,
  getHealthRecords,
} from "@/lib/data-service"

// Define interfaces for our data types
interface NurseProfile {
  id: string
  [key: string]: any
}

interface Patient {
  id: string
  user?: {
    email?: string
    user_metadata?: {
      full_name?: string
      name?: string
    }
  }
  doctor_id?: string | null
  [key: string]: any
}

interface VitalSign {
  id: string
  health_record_id: string
  recorded_at: string
  temperature: number
  systolic: number
  diastolic: number
  recorded_by: string
  notes?: string
  health_record?: {
    patient?: {
      user?: {
        email?: string
        user_metadata?: {
          full_name?: string
          name?: string
        }
      }
    }
  }
  [key: string]: any
}

interface NewVitalSignsData {
  patientId: string
  temperature: string
  systolic: string
  diastolic: string
  notes: string
}

interface VitalSignsFormProps {
  onSubmit: (data: NewVitalSignsData) => void
  patients: Patient[]
  setIsAddVitalSignsOpen: (isOpen: boolean) => void
}

export default function VitalSignsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nurseProfile, setNurseProfile] = useState<NurseProfile | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddVitalSignsOpen, setIsAddVitalSignsOpen] = useState(false)

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

          // Get vital signs recorded by this nurse
          const vitalSignsData = await getVitalSigns({ recorded_by: user.id })
          setVitalSigns(vitalSignsData)
        }
      } catch (err: any) {
        console.error("Error loading vital signs data:", err)
        setError(err.message || "Failed to load vital signs data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const filteredVitalSigns = vitalSigns.filter((vs) => {
    const patientName =
      vs.health_record?.patient?.user?.user_metadata?.full_name ||
      vs.health_record?.patient?.user?.user_metadata?.name ||
      ""

    return patientName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleAddVitalSigns = async (newVitalSigns: NewVitalSignsData) => {
    try {
      const healthRecords = await getHealthRecords({ patient_id: newVitalSigns.patientId })

      let healthRecordId

      if (!healthRecords || healthRecords.length === 0) {
        const patient = patients.find((p) => p.id === newVitalSigns.patientId)
        const doctorId = patient?.doctor_id || null

        const newRecord = {
          patient_id: newVitalSigns.patientId,
          doctor_id: doctorId,
          visit_date: new Date().toISOString(),
          diagnosis_name: "Routine Check-up",
          diagnosis_severity: "low",
          notes: "Vital signs recorded by nurse",
        }

        const success = await createHealthRecord(newRecord)
        if (!success) throw new Error("Failed to create health record")

        const updatedRecords = await getHealthRecords({ patient_id: newVitalSigns.patientId })
        healthRecordId = updatedRecords[0].id
      } else {
        healthRecordId = healthRecords[0].id
      }

      if (!user) {
        throw new Error("User not authenticated")
      }

      const newVitalSign = await addVitalSigns({
        health_record_id: healthRecordId,
        recorded_at: new Date().toISOString(),
        temperature: Number.parseFloat(newVitalSigns.temperature),
        systolic: Number.parseInt(newVitalSigns.systolic),
        diastolic: Number.parseInt(newVitalSigns.diastolic),
        recorded_by: user.id,
        notes: newVitalSigns.notes,
      })

      if (user) {
        const updatedVitalSigns = await getVitalSigns({ recorded_by: user.id })
        setVitalSigns(updatedVitalSigns)
      }

      setIsAddVitalSignsOpen(false)
      toast({
        title: "Vital Signs Added",
        description: "New vital signs have been successfully recorded.",
      })
    } catch (err) {
      console.error("Error adding vital signs:", err)
      toast({
        title: "Error",
        description: "Failed to record vital signs. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="nurse" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading vital signs data...</p>
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
        <Header
          title="Vital Signs"
          actions={
            <Button onClick={() => setIsAddVitalSignsOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Record Vital Signs
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
                    placeholder="Search vital signs records..."
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
                    <TableHead>ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Blood Pressure</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVitalSigns.length > 0 ? (
                    filteredVitalSigns.map((vs) => (
                      <TableRow key={vs.id}>
                        <TableCell className="font-medium">{vs.id}</TableCell>
                        <TableCell>
                          {vs.health_record?.patient?.user?.user_metadata?.full_name ||
                            vs.health_record?.patient?.user?.user_metadata?.name ||
                            vs.health_record?.patient?.user?.email ||
                            "Unknown Patient"}
                        </TableCell>
                        <TableCell>{vs.temperature}°C</TableCell>
                        <TableCell>
                          {vs.systolic}/{vs.diastolic} mmHg
                        </TableCell>
                        <TableCell>{new Date(vs.recorded_at).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-xs truncate">{vs.notes || "No notes"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No vital signs records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={isAddVitalSignsOpen} onOpenChange={setIsAddVitalSignsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Vital Signs</DialogTitle>
            <DialogDescription>Enter the patient's vital signs information below.</DialogDescription>
          </DialogHeader>
          <VitalSignsForm
            onSubmit={handleAddVitalSigns}
            patients={patients}
            setIsAddVitalSignsOpen={setIsAddVitalSignsOpen}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function VitalSignsForm({ onSubmit, patients, setIsAddVitalSignsOpen }: VitalSignsFormProps) {
  const [formData, setFormData] = useState<NewVitalSignsData>({
    patientId: "",
    temperature: "",
    systolic: "",
    diastolic: "",
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="patient">Patient</Label>
          <Select
            name="patientId"
            onValueChange={(value) =>
              handleChange({ target: { name: "patientId", value } } as React.ChangeEvent<HTMLInputElement>)
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient: Patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.user?.user_metadata?.full_name ||
                    patient.user?.user_metadata?.name ||
                    patient.user?.email ||
                    "Unknown Patient"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="temperature">Temperature (°C)</Label>
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
            <Label htmlFor="systolic">Systolic (mmHg)</Label>
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
            <Label htmlFor="diastolic">Diastolic (mmHg)</Label>
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
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setIsAddVitalSignsOpen(false)}>
          Cancel
        </Button>
        <Button type="submit">Record Vital Signs</Button>
      </div>
    </form>
  )
}
