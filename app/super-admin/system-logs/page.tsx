"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface LogEntry {
  id: string
  user_id: string
  action: string
  timestamp: string
  metadata: any
}

export default function SystemLogsPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLogs() {
      if (!user) return

      try {
        const isSuperAdmin = user.user_metadata?.role === "super-admin"
        if (!isSuperAdmin) throw new Error("Unauthorized: Not a super admin")

        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        if (!token) throw new Error("No auth token found")

        const response = await fetch("/api/admin/systemLogs", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to fetch logs")
        }

        const data = await response.json()
        setLogs(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="super-admin" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4">Loading system logs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar role="super-admin" />
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="bg-red-100 text-red-700 p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-100">
      <Sidebar role="super-admin" />
      <div className="flex-1 flex flex-col">
        <Header title="System Logs" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-2">User ID</th>
                        <th className="px-4 py-2">Action</th>
                        <th className="px-4 py-2">Metadata</th>
                        <th className="px-4 py-2">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length > 0 ? (
                        logs.map((log) => (
                          <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{log.user_id}</td>
                            <td className="px-4 py-2">{log.action}</td>
                            <td className="px-4 py-2 whitespace-pre-wrap">
                              <pre className="text-xs">{JSON.stringify(log.metadata, null, 2)}</pre>
                            </td>
                            <td className="px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                            No logs available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
