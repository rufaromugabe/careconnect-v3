"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Search, Plus, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Header } from "@/components/layout/header"
import { useAuth } from "@/contexts/auth-context"
import { getDoctorProfile, getAppointments, getDoctorPatients } from "@/lib/data-service"
import { supabase } from "@/lib/supabase"
import { logAction } from "@/lib/logging"

// Type definitions
interface Patient {
  id: string;
  users?: {
    user_metadata?: {
      full_name?: string;
      name?: string;
    };
    email?: string;
  };
}

interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  date_time: string;
  status: "scheduled" | "completed" | "canceled";
  notes?: string;
  patients?: {
    users?: {
      user_metadata?: {
        full_name?: string;
        name?: string;
      };
    };
  };
}

interface DoctorProfile {
  id: string;
}

interface AppointmentFormData {
  patientId: string;
  date: string;
  time: string;
  notes: string;
}

interface AppointmentFormProps {
  onSubmit: (formData: AppointmentFormData) => Promise<void>;
  patients: Patient[];
  setIsNewAppointmentOpen: (isOpen: boolean) => void;
  formError: string | null;
}

export default function DoctorAppointmentsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
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
          // Get appointments
          const appointmentData = await getAppointments({ doctor_id: profile.id })
          setAppointments(appointmentData)

          // Get patients for the appointment form
          const patientData = await getDoctorPatients(profile.id)
          setPatients(patientData)
        }
      } catch (err: any) {
        console.error("Error loading appointments data:", err)
        setError(err.message || "Failed to load appointments data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const filteredAppointments = appointments.filter((appointment) => {
    const patientName =
      appointment.patients?.users?.user_metadata?.full_name || appointment.patients?.users?.user_metadata?.name || ""

    const matchesSearch =
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateAppointment = async (formData: AppointmentFormData) => {
    if (!doctorProfile) return

    try {
      setFormError(null)

      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}:00`)

      // Create the appointment
      const newAppointment = {
        doctor_id: doctorProfile.id,
        patient_id: formData.patientId,
        date_time: dateTime.toISOString(),
        status: "scheduled",
        notes: formData.notes || "",
      }

      // Insert the appointment
      const { error: appointmentError } = await supabase.from("appointments").insert(newAppointment)
      //logging action
      await logAction(
        doctorProfile.id,
        `created an appointment for patient: ${newAppointment.patient_id}`,
        {
          email: user?.email || '',
          status: "created",
          dateTime: newAppointment.date_time,

        }
      )
      if (appointmentError) throw appointmentError

      // Refresh appointments
      const updatedAppointments = await getAppointments({ doctor_id: doctorProfile.id })
      setAppointments(updatedAppointments)

      // Close the dialog
      setIsNewAppointmentOpen(false)
    } catch (err: any) {
      console.error("Error creating appointment:", err)
      setFormError(err.message || "Failed to create appointment")
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="doctor" />
        <div className="flex-1 flex flex-col">
                <Header title={`Loading `} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading appointments data...</p>
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
      <main className="flex-1 flex flex-col">
        <Header
          title="Appointments"
          actions={
            <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-xl">

                <DialogHeader>
                  <DialogTitle>Create New Appointment</DialogTitle>
                  <DialogDescription>Schedule a new appointment with a patient.</DialogDescription>
                </DialogHeader>
                <AppointmentForm
                  onSubmit={handleCreateAppointment}
                  patients={patients}
                  setIsNewAppointmentOpen={setIsNewAppointmentOpen}
                  formError={formError}
                />
              </DialogContent>
            </Dialog>
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
                      placeholder="Search appointments..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
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
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.length > 0 ? (
                    filteredAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          {appointment.patients?.users?.user_metadata?.full_name ||
                            appointment.patients?.users?.user_metadata?.name ||
                            "Unknown Patient"}
                        </TableCell>
                        <TableCell>{new Date(appointment.date_time).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(appointment.date_time).toLocaleTimeString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              appointment.status === "scheduled"
                                ? "default"
                                : appointment.status === "completed"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No appointments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </main>
      </main>
    </div>
  )
}

function AppointmentForm({ onSubmit, patients, setIsNewAppointmentOpen, formError }: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<AppointmentFormData>({
    patientId: "",
    date: "",
    time: "",
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
          <Label htmlFor="patient">Patient</Label>
          <Select name="patientId" onValueChange={(value) => handleSelectChange("patientId", value)}>
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
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="time">Time</Label>
          <Input id="time" name="time" type="time" value={formData.time} onChange={handleChange} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
        </div>
        {formError && <div className="text-sm font-medium text-destructive">{formError}</div>}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setIsNewAppointmentOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...
            </>
          ) : (
            "Schedule Appointment"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
