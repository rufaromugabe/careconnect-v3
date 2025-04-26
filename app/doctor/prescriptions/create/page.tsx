"use client"

import { useState, useEffect, FormEvent, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { getDoctorProfile, getDoctorPatients } from "@/lib/data-service"
import { supabase } from "@/lib/supabase"
import { toast } from 'react-toastify'
import { encrypt } from "@/lib/encryption" // Import encrypt directly
import { logAction } from "@/lib/logging"

// Define types
interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface User {
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
}

interface Patient {
  id: string;
  users?: User;
  dob?: string;
  blood_type?: string;
  allergies?: string;
}

interface DoctorProfile {
  id: string;
  user_id: string;
  license_number: string;
  specialization: string;
  hospital_id: string;
  users?: User;
}

export default function CreatePrescriptionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [notes, setNotes] = useState<string>("")
  const [medications, setMedications] = useState<Medication[]>([{ id: 1, name: "", dosage: "", frequency: "", duration: "" }])

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)

        // Get doctor profile
        const profile = await getDoctorProfile(user.id)
        setDoctorProfile(profile as DoctorProfile)

        if (profile) {
          // Get patients for the prescription form
          const patientData = await getDoctorPatients(profile.id)
          setPatients(patientData as Patient[])
        }
      } catch (err) {
        console.error("Error loading data:", err)
     
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId)
    setSelectedPatient(patient || null)
  }

  const handleMedicationChange = (index: number, field: keyof Omit<Medication, 'id'>, value: string) => {
    const updatedMedications = [...medications]
    updatedMedications[index][field] = value
    setMedications(updatedMedications)
  }

  const addMedication = () => {
    setMedications([...medications, { id: medications.length + 1, name: "", dosage: "", frequency: "", duration: "" }])
  }

  const removeMedication = (index: number) => {
    if (medications.length === 1) {
      return // Don't remove the last medication
    }
    const updatedMedications = medications.filter((_, i) => i !== index)
    setMedications(updatedMedications)
  }

  const validateForm = () => {
    if (!selectedPatient) {
      setFormError("Please select a patient")
      return false
    }

    // Check if any medication is missing required fields
    const invalidMedication = medications.find((med) => !med.name || !med.dosage)
    if (invalidMedication) {
      setFormError("All medications must have a name and dosage")
      return false
    }

    setFormError(null)
    return true
  }

  // Update the handleSubmit function to handle encryption
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Create the prescription with directly encrypted notes
      const encryptedNotes = notes ? encrypt(notes) : ""

      console.log("Creating prescription with encrypted notes:", encryptedNotes ? "ENCRYPTED" : "")

      if (!doctorProfile || !selectedPatient || !user) {
        throw new Error("Missing required data: doctor profile, patient, or user")
      }

      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from("prescriptions")
        .insert({
          doctor_id: doctorProfile.id,
          patient_id: selectedPatient.id,
          status: "pending",
          notes: encryptedNotes,
        })
        .select()

      if (prescriptionError) throw prescriptionError

      if (prescriptionData && prescriptionData.length > 0) {
        const prescriptionId = prescriptionData[0].id

        // Create all medications
        const medicationsToInsert = medications.map((med) => ({
          prescription_id: prescriptionId,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency || null,
          duration: med.duration || null,
        }))

        const { error: medicationsError } = await supabase.from("medications").insert(medicationsToInsert)

        if (medicationsError) throw medicationsError
        //log the action
        await logAction(
          doctorProfile.id,
          `created prescription for patient: ${selectedPatient.id}`,
          {
            email: user.email,
            status: "created",
            prescription_id: prescriptionId,
            patient_id: selectedPatient.id,
          }
        )
        
        toast.success("Prescription created successfully" )

        

        // Navigate back to prescriptions list
        router.push("/doctor/prescriptions")
      }
    } catch (err) {
      console.error("Error creating prescription:", err)
      toast.success("Failed to create prescription" )
    
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="doctor" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading data...</p>
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
          title="Create New Prescription"
          actions={
            <Button variant="outline" onClick={() => router.push("/doctor/prescriptions")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Prescriptions
            </Button>
          }
        />
        <main className="flex-1 overflow-y-auto bg-muted/50">
          <div className="container mx-auto p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient">
                        Patient <span className="text-red-500">*</span>
                      </Label>
                      <Select onValueChange={handlePatientChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.users?.user_metadata?.full_name ||
                                patient.users?.user_metadata?.name ||
                                patient.users?.email ||
                                "Unknown Patient"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPatient && (
                      <div className="p-4 bg-muted rounded-md">
                        <h3 className="font-medium mb-2">Patient Details</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Name:</p>
                            <p>
                              {selectedPatient.users?.user_metadata?.full_name ||
                                selectedPatient.users?.user_metadata?.name ||
                                "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">DOB:</p>
                            <p>{selectedPatient.dob ? new Date(selectedPatient.dob).toLocaleDateString() : "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Blood Type:</p>
                            <p>{selectedPatient.blood_type || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Allergies:</p>
                            <p>{selectedPatient.allergies || "None"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes for the prescription"
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Medications */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Medications</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                      <Plus className="h-4 w-4 mr-1" /> Add Medication
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {medications.map((medication, index) => (
                      <div key={medication.id} className="p-4 border rounded-md relative">
                        <div className="absolute right-2 top-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMedication(index)}
                            disabled={medications.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <h3 className="font-medium mb-3">Medication {index + 1}</h3>
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor={`medication-${index}`}>
                              Medication Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`medication-${index}`}
                              value={medication.name}
                              onChange={(e) => handleMedicationChange(index, "name", e.target.value)}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`dosage-${index}`}>
                              Dosage <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`dosage-${index}`}
                              value={medication.dosage}
                              onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                              placeholder="e.g., 10mg"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor={`frequency-${index}`}>Frequency</Label>
                              <Input
                                id={`frequency-${index}`}
                                value={medication.frequency}
                                onChange={(e) => handleMedicationChange(index, "frequency", e.target.value)}
                                placeholder="e.g., Twice daily"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`duration-${index}`}>Duration</Label>
                              <Input
                                id={`duration-${index}`}
                                value={medication.duration}
                                onChange={(e) => handleMedicationChange(index, "duration", e.target.value)}
                                placeholder="e.g., 7 days"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {formError && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
                  {formError}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="mr-2"
                  onClick={() => router.push("/doctor/prescriptions")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Prescription"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}