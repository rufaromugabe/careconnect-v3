"use client"

import { useState, useEffect, ChangeEvent, FormEvent } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Search, Thermometer, Activity, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-toastify"
import { useAuth } from "@/contexts/auth-context"
import { getNurseProfile, getHealthRecords, addVitalSigns } from "@/lib/data-service"

// Type definitions
interface UserMetadata {
  full_name?: string;
  name?: string;
}

interface User {
  id: string;
  email?: string;
  user_metadata?: UserMetadata;
}

interface Patient {
  id: string;
  users?: User;
}

interface VitalSign {
  id?: string;
  recorded_at: string;
  temperature: number;
  systolic: number;
  diastolic: number;
  notes?: string;
  users?: User;
}

interface HealthRecord {
  id: string;
  diagnosis_name: string;
  diagnosis_severity: 'low' | 'medium' | 'high';
  visit_date: string;
  patients?: Patient;
  vital_signs?: VitalSign[];
  showVitalSigns?: boolean;
}

interface NurseProfile {
  id: string;
  user_id: string;
  hospital_id: string;
  specialization?: string;
  is_verified?: boolean;
  license_number?: string;
  department?: string;
  users?: User;
}

interface VitalSignsFormData {
  temperature: string;
  systolic: string;
  diastolic: string;
  notes: string;
}

interface VitalSignsFormProps {
  onSubmit: (data: VitalSignsFormData) => void;
  setIsAddVitalSignsOpen: (isOpen: boolean) => void;
}

export default function NurseHealthRecordsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nurseProfile, setNurseProfile] = useState<NurseProfile | null>(null)
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddVitalSignsOpen, setIsAddVitalSignsOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)

        // Get nurse profile
        const profile = await getNurseProfile(user.id)
        setNurseProfile(profile)

        if (profile) {
          // Get health records
          const healthRecordData = await getHealthRecords({})
          setHealthRecords(healthRecordData)
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

  const filteredHealthRecords = healthRecords.filter((record) => {
    const patientName =
      record.patients?.users?.user_metadata?.full_name || record.patients?.users?.user_metadata?.name || ""

    return (
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleAddVitalSigns = async (newVitalSigns: VitalSignsFormData) => {
    try {
      if (!selectedRecord || !user) return

      // Add vital signs to the selected health record
      await addVitalSigns({
        health_record_id: selectedRecord.id,
        recorded_at: new Date().toISOString(),
        temperature: Number.parseFloat(newVitalSigns.temperature),
        systolic: Number.parseInt(newVitalSigns.systolic),
        diastolic: Number.parseInt(newVitalSigns.diastolic),
        recorded_by: user.id,
        notes: newVitalSigns.notes,
      })

      // Refresh the health records data
      const updatedRecords = await getHealthRecords({})
      setHealthRecords(updatedRecords)

      setIsAddVitalSignsOpen(false)
      setSelectedRecord(null)

      toast.success(
         "Vital Signs Added",
      )
    } catch (err) {
      console.error("Error adding vital signs:", err)
      toast.error(
         "Failed to add vital signs. Please try again.",
       
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
          <p className="mt-4 text-lg">Loading health records data...</p>
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
        <Header title="Health Records" />
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
                    <TableHead>Actions</TableHead>
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
                                  ? "secondary"
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
                              onClick={() => setSelectedRecord({ ...record, showVitalSigns: true })}
                            >
                              <Activity className="h-3 w-3 mr-1" /> Recorded
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50">
                              <Thermometer className="h-3 w-3 mr-1" /> Not Recorded
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(record)
                              setIsAddVitalSignsOpen(true)
                            }}
                          >
                            Add Vital Signs
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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

      <Dialog open={isAddVitalSignsOpen} onOpenChange={setIsAddVitalSignsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vital Signs</DialogTitle>
            <DialogDescription>
              Record vital signs for{" "}
              {selectedRecord?.patients?.users?.user_metadata?.full_name ||
                selectedRecord?.patients?.users?.user_metadata?.name ||
                "this patient"}
              's health record.
            </DialogDescription>
          </DialogHeader>
          <VitalSignsForm onSubmit={handleAddVitalSigns} setIsAddVitalSignsOpen={setIsAddVitalSignsOpen} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={selectedRecord?.showVitalSigns}
        onOpenChange={() => setSelectedRecord((prev) => (prev ? { ...prev, showVitalSigns: false } : null))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vital Signs</DialogTitle>
            <DialogDescription>Detailed vital signs information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRecord?.vital_signs?.map((vs, index) => (
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
                      {vs.users?.user_metadata?.full_name ||
                        vs.users?.user_metadata?.name ||
                        vs.users?.email ||
                        "Unknown"}
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
    </div>
  )
}

function VitalSignsForm({ onSubmit, setIsAddVitalSignsOpen }: VitalSignsFormProps) {
  const [formData, setFormData] = useState<VitalSignsFormData>({
    temperature: "",
    systolic: "",
    diastolic: "",
    notes: "",
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
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
        <Button type="submit">Save Vital Signs</Button>
      </div>
    </form>
  )
}
