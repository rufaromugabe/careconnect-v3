"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { UserPlus, Store, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export default function SuperAdminDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [doctors, setDoctors] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [pharmacists, setPharmacists] = useState<any[]>([])
  const [pharmacies, setPharmacies] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)

        // For super admin, we'll use a different approach to avoid the recursion
        // First, check if the user has the super-admin role in their metadata
        const isSuperAdmin = user.user_metadata?.role === "super-admin"

        if (!isSuperAdmin) {
          throw new Error("Unauthorized: User is not a super admin")
        }

        // Get counts of different user types using direct API calls
        const doctorsPromise = supabase.from("doctors").select("id")
        const patientsPromise = supabase.from("patients").select("id")
        const pharmacistsPromise = supabase.from("pharmacists").select("id")
        const pharmaciesPromise = supabase.from("pharmacies").select("*")
        
        // Instead of using admin API, use a safer alternative to get users
        // We'll use a server route or user_roles table
        const userRolesPromise = supabase.from("user_roles").select("user_id, role, created_at").order('created_at', { ascending: false }).limit(10)

        const [
          { data: doctorData, error: doctorError },
          { data: patientData, error: patientError },
          { data: pharmacistData, error: pharmacistError },
          { data: pharmacyData, error: pharmacyError },
          { data: userRoleData, error: userRoleError },
        ] = await Promise.all([
          doctorsPromise, 
          patientsPromise, 
          pharmacistsPromise, 
          pharmaciesPromise, 
          userRolesPromise
        ])

        // Handle any database query errors
        if (doctorError) console.warn("Error fetching doctors:", doctorError)
        if (patientError) console.warn("Error fetching patients:", patientError)
        if (pharmacistError) console.warn("Error fetching pharmacists:", pharmacistError)
        if (pharmacyError) console.warn("Error fetching pharmacies:", pharmacyError)
        if (userRoleError) console.warn("Error fetching user roles:", userRoleError)
        
        // Set empty arrays as fallbacks if data is null
        setDoctors(doctorData || [])
        setPatients(patientData || [])
        setPharmacists(pharmacistData || [])
        setPharmacies(pharmacyData || [])
        
        // Format user role data to match expected structure for display
        const formattedUsers = (userRoleData || []).map(entry => ({
          id: entry.user_id,
          created_at: entry.created_at,
          email: `User ${entry.user_id.substring(0, 8)}...`,
          user_metadata: { 
            role: entry.role
          }
        }))
        
        setRecentUsers(formattedUsers)
      } catch (err: any) {
        console.error("Error loading super admin dashboard data:", err)
        setError(err.message || "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Calculate stats - handle empty data gracefully
  const stats = [
    {
      label: "Total Doctors",
      value: doctors?.length || 0,
      icon: UserPlus,
      href: "/super-admin/doctors",
      color: "bg-violet-500",
    },
    {
      label: "Total Pharmacies",
      value: pharmacies?.length || 0,
      icon: Store,
      href: "/super-admin/pharmacies",
      color: "bg-emerald-500",
    },
    {
      label: "Total Users",
      value: (doctors?.length || 0) + (pharmacists?.length || 0) + (patients?.length || 0),
      icon: Users,
      href: "/super-admin/users",
      color: "bg-blue-500",
    },
  ]

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="super-admin" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar role="super-admin" />
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
      <Sidebar role="super-admin" />
      <div className="flex-1 flex flex-col">
        <Header title="Super Admin Dashboard" />
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
                    </div>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <p className="text-sm opacity-90 mb-4">{stat.label}</p>
                    <Link href={stat.href} passHref>
                      <Button className="w-full bg-white text-gray-800 hover:bg-gray-100">Manage</Button>
                    </Link>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent User Registrations</h3>
                <ul className="space-y-4">
                  {recentUsers.length > 0 ? (
                    recentUsers
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 5)
                      .map((user) => (
                        <li key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">
                              {user.user_metadata?.full_name || user.user_metadata?.name || user.email}
                            </p>
                            <p className="text-sm text-gray-600">{user.user_metadata?.role || "Unknown role"}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                            View
                          </Button>
                        </li>
                      ))
                  ) : (
                    <li className="text-center text-gray-500 py-4">No recent users found</li>
                  )}
                </ul>
                <Link href="/super-admin/users" passHref>
                  <Button className="mt-4 w-full bg-blue-500 text-white hover:bg-blue-600">Manage All Users</Button>
                </Link>
              </Card>

              <Card className="p-6 bg-white shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Pharmacy Registrations</h3>
                <ul className="space-y-4">
                  {pharmacies.length > 0 ? (
                    pharmacies.slice(0, 5).map((pharmacy) => (
                      <li key={pharmacy.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{pharmacy.name}</p>
                          <p className="text-sm text-gray-600">{pharmacy.location}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                          View
                        </Button>
                      </li>
                    ))
                  ) : (
                    <li className="text-center text-gray-500 py-4">No pharmacies found</li>
                  )}
                </ul>
                <Link href="/super-admin/pharmacies" passHref>
                  <Button className="mt-4 w-full bg-emerald-500 text-white hover:bg-emerald-600">
                    Manage All Pharmacies
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
