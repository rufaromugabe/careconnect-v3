"use client"

import { useState, useEffect, ChangeEvent, FormEvent } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Search, Plus, Edit, Trash, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import { useAuth } from "@/contexts/auth-context"
import { getDoctorProfile, getDoctorPatients } from "@/lib/data-service"
import { supabase } from "@/lib/supabase"

// Define patient type
interface Patient {
  id?: string
  name?: string
  email: string
  bloodType?: string
  allergies?: string
}

// Define props for PatientFormDialog
interface PatientFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (patient: Patient) => void
  title: string
  patient?: Patient | null
}

export default function PatientsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<any>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)

        // Get doctor profile
        const profile = await getDoctorProfile(user.id)
        setDoctorProfile(profile)

        if (profile) {
          // Get doctor's patients
          const patientData = await getDoctorPatients(profile.id)
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

  // Update the filteredPatients function to handle the new data structure
  const filteredPatients = patients.filter((patient) => {
    if (!patient.users) return false

    const patientName = patient.users?.user_metadata?.full_name || patient.users?.user_metadata?.name || ""
    const patientEmail = patient.users?.email || ""

    return (
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientEmail.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleAddPatient = async (newPatient: any) => {
    try {
      // In a real app, you would create a new patient record in Supabase
      // For now, we'll just add it to the local state

      // First, check if the patient exists by email
      const { data: existingUsers, error: userError } = await supabase.auth.admin.listUsers()

      if (userError) {
        throw userError
      }

      const existingUser = existingUsers?.users.find((u) => u.email === newPatient.email)

      if (!existingUser) {
        toast(
           "User Not Found",
        )
        return
      }

      // Check if user is already a patient
      const { data: existingPatient, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", existingUser.id)
        .single()

      if (existingPatient) {
        // Update the patient's doctor_id
        const { error: updateError } = await supabase
          .from("patients")
          .update({ doctor_id: doctorProfile.id })
          .eq("id", existingPatient.id)

        if (updateError) {
          throw updateError
        }

        // Refresh the patient list
        const patientData = await getDoctorPatients(doctorProfile.id)
        setPatients(patientData)

        toast.success(
          "Patient Added"
          )
      } else {
        toast(
          "Not a Patient",
        )
      }

      setIsAddPatientOpen(false)
    } catch (err: any) {
      console.error("Error adding patient:", err)
      toast.error(
         err.message || "Failed to add patient",
      )
    }
  }

  const handleEditPatient = async (updatedPatient: any) => {
    try {
      // In a real app, you would update the patient record in Supabase
      // For now, we'll just update the local state
      const { error } = await supabase
        .from("patients")
        .update({
          blood_type: updatedPatient.bloodType,
          allergies: updatedPatient.allergies ? updatedPatient.allergies.split(",") : null,
        })
        .eq("id", updatedPatient.id)

      if (error) {
        throw error
      }

      // Refresh the patient list
      const patientData = await getDoctorPatients(doctorProfile.id)
      setPatients(patientData)

      setEditingPatient(null)
      toast.success(
         "Patient Updated",
    )
    } catch (err: any) {
      console.error("Error updating patient:", err)
      toast.error(
         err.message || "Failed to update patient",
       
      )
    }
  }

  const handleDeletePatient = async (patientId: string) => {
    try {
      // In a real app, you would remove the doctor_id from the patient record
      const { error } = await supabase.from("patients").update({ doctor_id: null }).eq("id", patientId)

      if (error) {
        throw error
      }

      // Refresh the patient list
      const patientData = await getDoctorPatients(doctorProfile.id)
      setPatients(patientData)

      toast.success(
         "Patient Removed",
        )
    } catch (err: any) {
      console.error("Error removing patient:", err)
      toast(
        err.message || "Failed to remove patient",
        
      )
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="doctor" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading patients data...</p>
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
          title="My Patients"
          actions={
            <Button onClick={() => setIsAddPatientOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Patient
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
                    <TableHead>Allergies</TableHead>
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
                        <TableCell>{patient.users?.email}</TableCell>
                        <TableCell>{patient.blood_type || "Not specified"}</TableCell>
                        <TableCell>
                          {patient.allergies && patient.allergies.length > 0 ? patient.allergies.join(", ") : "None"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setEditingPatient({
                                  id: patient.id,
                                  name: patient.users?.user_metadata?.full_name || patient.users?.user_metadata?.name,
                                  email: patient.users?.email,
                                  bloodType: patient.blood_type || "",
                                  allergies: patient.allergies ? patient.allergies.join(", ") : "",
                                })
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeletePatient(patient.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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

      <PatientFormDialog
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onSubmit={handleAddPatient}
        title="Add New Patient"
      />

      <PatientFormDialog
        isOpen={!!editingPatient}
        onClose={() => setEditingPatient(null)}
        onSubmit={handleEditPatient}
        title="Edit Patient"
        patient={editingPatient}
      />
    </div>
  )
}

function PatientFormDialog({ isOpen, onClose, onSubmit, title, patient = null }: PatientFormDialogProps) {
  const [formData, setFormData] = useState<Patient>(
    patient || {
      name: "",
      email: "",
      bloodType: "",
      allergies: "",
    },
  )

  useEffect(() => {
    if (patient) {
      setFormData(patient)
    } else {
      setFormData({
        name: "",
        email: "",
        bloodType: "",
        allergies: "",
      })
    }
  }, [patient])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Enter the patient's information below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {!patient && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="email" className="text-right">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="col-span-3"
                  required={!patient}
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="bloodType" className="text-right">
                Blood Type
              </label>
              <Input
                id="bloodType"
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="allergies" className="text-right">
                Allergies
              </label>
              <Input
                id="allergies"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Separate with commas"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{patient ? "Update" : "Add"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
