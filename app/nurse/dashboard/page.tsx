"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Activity, Users, Thermometer, Calendar, Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useAuth } from "@/contexts/auth-context"
import { getNurseProfile, getNursePatients, getHealthRecords, getVitalSigns } from "@/lib/data-service"

export default function NurseDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nurseProfile, setNurseProfile] = useState<any>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [healthRecords, setHealthRecords] = useState<any[]>([])
  const [vitalSigns, setVitalSigns] = useState<any[]>([])

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

          // Get health records
          const healthRecordData = await getHealthRecords({})
          setHealthRecords(healthRecordData)

          // Get vital signs
          const vitalSignsData = await getVitalSigns({ recorded_by: user.id })
          setVitalSigns(vitalSignsData)
        }
      } catch (err: any) {
        console.error("Error loading nurse dashboard data:", err)
        setError(err.message || "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Generate chart data based on vital signs
  const chartData = [
    { name: "Mon", vitals: vitalSigns.filter((vs) => new Date(vs.recorded_at).getDay() === 1).length || 0 },
    { name: "Tue", vitals: vitalSigns.filter((vs) => new Date(vs.recorded_at).getDay() === 2).length || 0 },
    { name: "Wed", vitals: vitalSigns.filter((vs) => new Date(vs.recorded_at).getDay() === 3).length || 0 },
    { name: "Thu", vitals: vitalSigns.filter((vs) => new Date(vs.recorded_at).getDay() === 4).length || 0 },
    { name: "Fri", vitals: vitalSigns.filter((vs) => new Date(vs.recorded_at).getDay() === 5).length || 0 },
    { name: "Sat", vitals: vitalSigns.filter((vs) => new Date(vs.recorded_at).getDay() === 6).length || 0 },
    { name: "Sun", vitals: vitalSigns.filter((vs) => new Date(vs.recorded_at).getDay() === 0).length || 0 },
  ]

  // Calculate stats
  const stats = [
    {
      label: "My Patients",
      value: patients.length,
      icon: Users,
      change: "+5%", // This would be calculated in a real app
      color: "bg-blue-500",
    },
    {
      label: "Vital Signs Recorded",
      value: vitalSigns.length,
      icon: Thermometer,
      change: "+12%",
      color: "bg-emerald-500",
    },
    {
      label: "Appointments Today",
      value: 5, // This would be fetched in a real app
      icon: Calendar,
      change: "+2%",
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
        <Sidebar role="nurse" />
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

  const nurseName = nurseProfile?.users?.user_metadata?.full_name || nurseProfile?.users?.user_metadata?.name || "Nurse"

  return (
    <div className="flex h-screen bg-background">
      <Sidebar role="nurse" />
      <div className="flex-1 flex flex-col">
        <Header title={`${nurseName}'s Dashboard`} />
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
              <Card className="p-6 bg-primary-foreground shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Vital Signs Recorded This Week</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="vitals" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6 bg-primary-foreground shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">My Patients</h3>
                <div className="space-y-4">
                  {patients.length > 0 ? (
                    patients.slice(0, 5).map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {patient.user?.user_metadata?.full_name?.charAt(0) ||
                            patient.user?.user_metadata?.name?.charAt(0) ||
                            "P"}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {patient.user?.user_metadata?.full_name ||
                              patient.user?.user_metadata?.name ||
                              patient.user?.email ||
                              "Unknown Patient"}
                          </h4>
                          <p className="text-sm text-gray-600">{patient.user?.email}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No patients found</p>
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
