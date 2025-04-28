"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Activity, Users, FileText, Calendar, Thermometer, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getDoctorProfile, getDoctorPatients, getAppointments, getHealthRecords } from "@/lib/data-service"

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<any>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [healthRecords, setHealthRecords] = useState<any[]>([])

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

          // Get appointments
          const appointmentData = await getAppointments({ doctor_id: profile.id })
          setAppointments(appointmentData)

          // Get health records
          const healthRecordData = await getHealthRecords({ doctor_id: profile.id })
          setHealthRecords(healthRecordData)
        }
      } catch (err: any) {
        console.error("Error loading doctor dashboard data:", err)
        setError(err.message || "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Generate chart data based on appointments
  const chartData = [
    { name: "Mon", patients: appointments.filter((a) => new Date(a.date_time).getDay() === 1).length || 0 },
    { name: "Tue", patients: appointments.filter((a) => new Date(a.date_time).getDay() === 2).length || 0 },
    { name: "Wed", patients: appointments.filter((a) => new Date(a.date_time).getDay() === 3).length || 0 },
    { name: "Thu", patients: appointments.filter((a) => new Date(a.date_time).getDay() === 4).length || 0 },
    { name: "Fri", patients: appointments.filter((a) => new Date(a.date_time).getDay() === 5).length || 0 },
    { name: "Sat", patients: appointments.filter((a) => new Date(a.date_time).getDay() === 6).length || 0 },
    { name: "Sun", patients: appointments.filter((a) => new Date(a.date_time).getDay() === 0).length || 0 },
  ]

  // Calculate stats
  const stats = [
    {
      label: "My Patients",
      value: patients.length,
      icon: Users,
      change: "+12%", // This would be calculated in a real app
      color: "bg-blue-500",
    },
    {
      label: "Active Prescriptions",
      value: 0, // This would be fetched in a real app
      icon: FileText,
      change: "+4%",
      color: "bg-emerald-500",
    },
    {
      label: "Appointments Today",
      value: appointments.filter((a) => new Date(a.date_time).toDateString() === new Date().toDateString()).length,
      icon: Calendar,
      change: "-2%",
      color: "bg-violet-500",
    },
    {
      label: "Health Records",
      value: healthRecords.length,
      icon: Activity,
      change: "+8%",
      color: "bg-amber-500",
    },
  ]

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="doctor" />
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

  const doctorName =
    doctorProfile?.users?.user_metadata?.full_name || doctorProfile?.users?.user_metadata?.name || "Doctor"

  return (
    <div className="flex h-screen bg-background">
      <Sidebar role="doctor" />
      <div className="flex-1 flex flex-col">
        <Header title={`Dr. ${doctorName}'s Dashboard`} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
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
                      <span className={`text-sm ${stat.change.startsWith("+") ? "text-green-200" : "text-red-200"}`}>
                        {stat.change}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <p className="text-sm opacity-90">{stat.label}</p>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 bg-white shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Patient Visits This Week</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="patients" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">My Patients</h3>
                <div className="space-y-4">
                  {patients.length > 0 ? (
                    patients.slice(0, 5).map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {patient.users?.user_metadata?.full_name?.charAt(0) ||
                            patient.users?.user_metadata?.name?.charAt(0) ||
                            "P"}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {patient.users?.user_metadata?.full_name ||
                              patient.users?.user_metadata?.name ||
                              patient.users?.email ||
                              "Unknown Patient"}
                          </h4>
                          <p className="text-sm text-gray-600">{patient.users?.email}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No patients found</p>
                  )}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 bg-white shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Vital Signs</h3>
                <div className="space-y-4">
                  {healthRecords.filter((record) => record.vital_signs && record.vital_signs.length > 0).length > 0 ? (
                    healthRecords
                      .filter((record) => record.vital_signs && record.vital_signs.length > 0)
                      .slice(0, 3)
                      .map((record) => {
                        const patient = record.patients
                        const latestVitalSign = record.vital_signs[record.vital_signs.length - 1]
                        return (
                          <div
                            key={record.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {patient?.users?.user_metadata?.full_name ||
                                  patient?.users?.user_metadata?.name ||
                                  patient?.users?.email ||
                                  "Unknown Patient"}
                              </h4>
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
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
