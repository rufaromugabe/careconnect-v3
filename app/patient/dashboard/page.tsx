"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Activity, FileText, Calendar, AlertCircle, UserPlus, Thermometer, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { getPatientProfile, getPatientPrescriptions, getPatientHealthRecords, getAllDoctors } from "@/lib/data-service"
import { supabase } from "@/lib/supabase"
import { logAction } from "@/lib/logging"

export default function PatientDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patientProfile, setPatientProfile] = useState<any>(null)
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [healthRecords, setHealthRecords] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [currentDoctor, setCurrentDoctor] = useState<any>(null)

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

          // Get patient's health records
          const healthRecordData = await getPatientHealthRecords(profile.id)
          setHealthRecords(healthRecordData)

          // Get all doctors
          const doctorData = await getAllDoctors()
          setDoctors(doctorData)

          // Get current doctor if assigned
          if (profile.doctor_id) {
            const currentDoctorData = doctorData.find((d) => d.id === profile.doctor_id)
            setCurrentDoctor(currentDoctorData)
          }
        }
      } catch (err: any) {
        console.error("Error loading patient dashboard data:", err)
        setError(err.message || "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const handleDoctorChange = async (doctorId: string) => {
    try {
      if (!patientProfile) return

      // Update patient's doctor_id in the database
      const { error } = await supabase.from("patients").update({ doctor_id: doctorId }).eq("id", patientProfile.id)

      if (error) throw error
      // log action
      await logAction(
        patientProfile.user_id,
        `changed doctor from ${patientProfile.doctor_id} to ${doctorId}`,
        {
          email: user.email,
          status: "success",
          action: "Change Doctor",
          Patient: patientProfile.name,
        }
      )
      // Update local state
      const selectedDoctor = doctors.find((d) => d.id === doctorId)
      setCurrentDoctor(selectedDoctor)
      setPatientProfile({
        ...patientProfile,
        doctor_id: doctorId,
      })
    } catch (err: any) {
      console.error("Error changing doctor:", err)
    }
  }

  // Calculate stats
  const stats = [
    {
      label: "Active Prescriptions",
      value: prescriptions.filter((p) => p.status === "pending").length,
      icon: FileText,
      href: "/patient/prescriptions",
      color: "bg-teal-500",
    },
    {
      label: "Upcoming Appointments",
      value: 2, // This would be fetched in a real app
      icon: Calendar,
      href: "/patient/appointments",
      color: "bg-indigo-500",
    },
    {
      label: "Health Records",
      value: healthRecords.length,
      icon: Activity,
      href: "/patient/health-records",
      color: "bg-rose-500",
    },
    {
      label: "Alerts",
      value: 1, // This would be calculated in a real app
      icon: AlertCircle,
      href: "/patient/alerts",
      color: "bg-amber-500",
    },
  ]

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="patient" />
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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-100">
      <Sidebar role="patient" />
      <div className="flex-1 flex flex-col">
        <Header title="Patient Dashboard" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <Card className="p-6 mb-8 bg-white shadow-lg rounded-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">My Doctor</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Change Doctor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Select Your Doctor</DialogTitle>
                      <DialogDescription>
                        Choose a doctor from the list below to be your primary care physician.
                      </DialogDescription>
                    </DialogHeader>
                    <Select onValueChange={handleDoctorChange} defaultValue={patientProfile?.doctor_id || "none"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Primary Doctor</SelectItem>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.users
                              ? doctor.users.user_metadata?.full_name ||
                                doctor.users.user_metadata?.name ||
                                doctor.users.email
                              : doctor.userData?.full_name || doctor.userData?.name || "Unknown Doctor"}{" "}
                            - {doctor.specialization || "General"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="mt-2 text-gray-600">
                Current Doctor:{" "}
                {currentDoctor
                  ? currentDoctor.users
                    ? currentDoctor.users.user_metadata?.full_name ||
                      currentDoctor.users.user_metadata?.name ||
                      currentDoctor.users.email
                    : currentDoctor.userData?.full_name || currentDoctor.userData?.name || "Not assigned"
                  : "Not assigned"}
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
                    <p className="text-sm opacity-90 mb-4">{stat.label}</p>
                    <Link href={stat.href} passHref>
                      <Button className="w-full bg-white text-gray-800 hover:bg-gray-100">View Details</Button>
                    </Link>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Prescriptions</h3>
                <ul className="space-y-4">
                  {prescriptions.length > 0 ? (
                    prescriptions.slice(0, 5).map((prescription) => (
                      <li key={prescription.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">
                            {prescription.medications[0]?.name || "Unknown Medication"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {prescription.medications[0]?.dosage || "No dosage specified"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            prescription.status === "pending"
                              ? "default"
                              : prescription.status === "filled"
                                ? "success"
                                : "destructive"
                          }
                        >
                          {prescription.status}
                        </Badge>
                      </li>
                    ))
                  ) : (
                    <li className="text-center text-gray-500 py-4">No prescriptions found</li>
                  )}
                </ul>
                <Link href="/patient/prescriptions" passHref>
                  <Button className="mt-4 w-full bg-teal-500 text-white hover:bg-teal-600">
                    View All Prescriptions
                  </Button>
                </Link>
              </Card>

              <Card className="p-6 bg-white shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Health Records</h3>
                <ul className="space-y-4">
                  {healthRecords.length > 0 ? (
                    healthRecords.slice(0, 5).map((record) => (
                      <li key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{record.diagnosis_name}</p>
                          <p className="text-sm text-gray-600">{new Date(record.visit_date).toLocaleDateString()}</p>
                        </div>
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
                      </li>
                    ))
                  ) : (
                    <li className="text-center text-gray-500 py-4">No health records found</li>
                  )}
                </ul>
                <Link href="/patient/health-records" passHref>
                  <Button className="mt-4 w-full bg-rose-500 text-white hover:bg-rose-600">
                    View All Health Records
                  </Button>
                </Link>
              </Card>

              <Card className="p-6 bg-white shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Vital Signs</h3>
                <div className="space-y-4">
                  {healthRecords.filter((record) => record.vital_signs && record.vital_signs.length > 0).length > 0 ? (
                    healthRecords
                      .filter((record) => record.vital_signs && record.vital_signs.length > 0)
                      .slice(0, 3)
                      .map((record) => {
                        const latestVitalSign = record.vital_signs[record.vital_signs.length - 1]
                        return (
                          <div
                            key={record.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <div>
                              <h4 className="font-medium text-gray-800">{record.diagnosis_name}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Thermometer className="h-4 w-4" />
                                <span>{latestVitalSign.temperature}°C</span>
                                <span className="mx-1">|</span>
                                <Activity className="h-4 w-4" />
                                <span>
                                  {latestVitalSign.systolic}/{latestVitalSign.diastolic} mmHg
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(latestVitalSign.recorded_at).toLocaleDateString()}
                            </span>
                          </div>
                        )
                      })
                  ) : (
                    <p className="text-center text-gray-500 py-4">No vital signs recorded</p>
                  )}
                </div>
                <Link href="/patient/health-records" passHref>
                  <Button className="mt-4 w-full bg-rose-500 text-white hover:bg-rose-600">View All Vital Signs</Button>
                </Link>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
