"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, UserPlus, UserX, UserCheck, Filter } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export default function SuperAdminUsersPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)

        // First, check if the user has the super-admin role in their metadata
        const isSuperAdmin = user.user_metadata?.role === "super-admin"

        if (!isSuperAdmin) {
          throw new Error("Unauthorized: User is not a super admin")
        }

        // Get the session for the auth token
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token

        if (!token) {
          throw new Error("No authentication token available")
        }

        // Fetch users directly using the admin API endpoint
        const response = await fetch("/api/admin/users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("API response error:", response.status, errorData)
          throw new Error(errorData.error || `API error: ${response.status}`)
        }

        const userData = await response.json()

        // Format the user data
        const formattedUsers = userData.map((user: any) => ({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || "Unknown",
          role: user.user_metadata?.role || "Unknown",
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at),
        }))

        setUsers(formattedUsers)
        setFilteredUsers(formattedUsers)
      } catch (err: any) {
        console.error("Error loading users data:", err)
        setError(err.message || "Failed to load users data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  useEffect(() => {
    // Filter users based on active tab
    if (activeTab === "all") {
      setFilteredUsers(users)
    } else {
      setFilteredUsers(users.filter((user) => user.role === activeTab))
    }
  }, [activeTab, users])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="super-admin" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading users data...</p>
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
        <Header title="User Management" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Users</h1>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <Tabs defaultValue="all" onValueChange={handleTabChange}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Users ({users.length})</TabsTrigger>
                <TabsTrigger value="doctor">Doctors ({users.filter((u) => u.role === "doctor").length})</TabsTrigger>
                <TabsTrigger value="patient">Patients ({users.filter((u) => u.role === "patient").length})</TabsTrigger>
                <TabsTrigger value="pharmacist">
                  Pharmacists ({users.filter((u) => u.role === "pharmacist").length})
                </TabsTrigger>
                <TabsTrigger value="nurse">Nurses ({users.filter((u) => u.role === "nurse").length})</TabsTrigger>
                <TabsTrigger value="super-admin">
                  Admins ({users.filter((u) => u.role === "super-admin").length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {activeTab === "all" ? "All Users" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Created</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                              <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{user.name}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      user.role === "doctor"
                                        ? "bg-blue-100 text-blue-800"
                                        : user.role === "patient"
                                          ? "bg-green-100 text-green-800"
                                          : user.role === "pharmacist"
                                            ? "bg-purple-100 text-purple-800"
                                            : user.role === "nurse"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : user.role === "super-admin"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {user.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4">{user.createdAt.toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Active
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex space-x-2">
                                    <Button variant="ghost" size="sm">
                                      <UserCheck className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                                      <UserX className="h-4 w-4 mr-1" />
                                      Disable
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 text-center">
                                No users found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
