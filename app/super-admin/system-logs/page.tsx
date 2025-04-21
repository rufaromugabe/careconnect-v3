"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, Filter, Clock, User, Activity } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

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

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesAction = actionFilter === "all" || log.action.toLowerCase().includes(actionFilter.toLowerCase())
    
    return matchesSearch && matchesAction
  })

  const actionTypes = Array.from(new Set(logs.map(log => {
    const action = log.action.split(':')[0]
    return action
  })))

  const formatMetadata = (metadata: any) => {
    if (!metadata) return "No metadata"
    
    if (metadata.email && metadata.userId) {
      return (
        <div className="space-y-1 text-sm">
          <div><span className="font-medium">Email:</span> {metadata.email}</div>
          <div><span className="font-medium">User:</span> {formatUserId(metadata.userId)}</div>
          {metadata.newStatus && (
            <div><span className="font-medium">Status:</span> <Badge className={metadata.newStatus === "Active" ? "bg-green-500 hover:bg-green-600" : ""} variant={metadata.newStatus === "Active" ? "default" : "destructive"}>{metadata.newStatus}</Badge></div>
          )}
        </div>
      )
    }
    
    return (
      <div className="space-y-1 text-sm">
        {Object.entries(metadata).map(([key, value]) => (
          <div key={key}>
            <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</span> {
              typeof value === 'object' ? JSON.stringify(value) : String(value)
            }
          </div>
        ))}
      </div>
    )
  }

  const formatAction = (action: string) => {
    const parts = action.split(':')
    
    if (parts.length > 1) {
      return (
        <div className="flex flex-col">
          <Badge variant="outline" className="mb-1 w-fit">{parts[0]}</Badge>
          <span>{parts[1].trim()}</span>
        </div>
      )
    }

    let variant: "default" | "destructive" | "outline" | "secondary" = "default"
    if (action.includes("enable") || action.includes("created")) {
      return <Badge className="bg-green-500 hover:bg-green-600">{action}</Badge>
    }
    if (action.includes("disable") || action.includes("deleted")) variant = "destructive"
    if (action.includes("updated") || action.includes("modified")) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">{action}</Badge>
    }
    
    return <Badge variant={variant}>{action}</Badge>
  }

  const formatUserId = (id: string) => {
    if (!id) return "Unknown"
    return id.substring(0, 8) + "..."
  }

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
            <Card className="shadow-lg">
              <CardHeader className="bg-white rounded-t-lg border-b">
                <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center">
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-600" />
                    System Activity Logs
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input 
                        type="search"
                        placeholder="Search logs..." 
                        className="pl-9 w-full sm:w-[200px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <div className="flex items-center">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filter by action" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Activities</SelectItem>
                        {actionTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  {filteredLogs.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-4 py-3">Admin</th>
                          <th className="px-4 py-3">Action</th>
                          <th className="px-4 py-3">Details</th>
                          <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 bg-primary/10">
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {log.user_id.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="text-xs text-gray-500">{formatUserId(log.user_id)}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">{formatAction(log.action)}</td>
                            <td className="px-4 py-3">
                              <div className="max-w-xs overflow-hidden">
                                {formatMetadata(log.metadata)}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center text-gray-600">
                                <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                {new Date(log.timestamp).toLocaleString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-10 text-center text-gray-500">
                      {searchTerm || actionFilter !== "all" 
                        ? "No matching logs found. Try adjusting your filters." 
                        : "No logs available"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
