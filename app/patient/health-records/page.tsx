"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/layout/header"
import { Search, FileText, Calendar, Activity, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Thermometer } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getPatientProfile, getPatientHealthRecords } from "@/lib/data-service"

export default function PatientHealthRecordsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [selectedVitalSigns, setSelectedVitalSigns] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [healthRecords, setHealthRecords] = useState<any[]>([])
  const [patientProfile, setPatientProfile] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)

        // Get patient profile
        const profile = await getPatientProfile(user.id)
        setPatientProfile(profile)

        if (profile) {
          // Get patient's health records
          const healthRecordData = await getPatientHealthRecords(profile.id)
          setHealthRecords(healthRecordData)
        }
      } catch (err: any) {
        console.error("Error loading patient health records:", err)
        setError(err.message || "Failed to load health records")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const filteredHealthRecords = healthRecords.filter(
    (record) =>
      record.diagnosis_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="patient" />
        <div className="flex-1 flex flex-col">
                <Header title={`Loading `} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading health records...</p>
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
    <div className="flex h-screen">
      <Sidebar role="patient" />
      <div className="flex-1 flex flex-col">
        <Header title="My Health Records" />
        <main className="flex-1 overflow-y-auto bg-muted/50">
          <div className="container mx-auto p-6">
            <Card className="mb-8">
              <div className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search health records..."
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
                    <TableHead>Date</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Vital Signs</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHealthRecords.length > 0 ? (
                    filteredHealthRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.visit_date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.diagnosis_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.diagnosis_severity === "low"
                                ? "default"
                                : record.diagnosis_severity === "medium"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {record.diagnosis_severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.doctors?.users?.user_metadata?.full_name ||
                            record.doctors?.users?.user_metadata?.name ||
                            "Unknown Doctor"}
                        </TableCell>
                        <TableCell>
                          {record.vital_signs && record.vital_signs.length > 0 ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 cursor-pointer dark:bg-green-500 dark:text-black"
                              onClick={() => setSelectedVitalSigns(record.vital_signs)}
                            >
                              <Activity className="h-3 w-3 mr-1" /> Recorded
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-400 dark:text-black">
                              <Thermometer className="h-3 w-3 mr-1" /> Not Recorded
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(record)}>
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No health records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-xl">

          <DialogHeader>
            <DialogTitle>Health Record Details</DialogTitle>
            <DialogDescription>Detailed information about your health record.</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Activity className="h-4 w-4" />
                <span className="font-semibold">Diagnosis:</span>
                <span className="col-span-2">{selectedRecord.diagnosis_name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold">Visit Date:</span>
                <span className="col-span-2">{new Date(selectedRecord.visit_date).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">Notes:</span>
                <span className="col-span-2">{selectedRecord.notes}</span>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setSelectedRecord(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!selectedVitalSigns} onOpenChange={() => setSelectedVitalSigns(null)}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 shadow-lg rounded-xl">

          <DialogHeader>
            <DialogTitle>Vital Signs</DialogTitle>
            <DialogDescription>Detailed vital signs information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedVitalSigns?.map((vs: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date Recorded</p>
                    <p>{new Date(vs.recorded_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Temperature</p>
                    <p>{vs.temperature}°C</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Blood Pressure</p>
                    <p>
                      {vs.systolic}/{vs.diastolic} mmHg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recorded By</p>
                    <p>
                      {vs.users?.user_metadata?.full_name ||
                        vs.users?.user_metadata?.name ||
                        `Nurse ID: ${vs.recorded_by}`}
                    </p>
                  </div>
                </div>
                {vs.notes && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p>{vs.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
