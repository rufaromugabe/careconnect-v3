"use client"

import type React from "react"

import { RoleGuard } from "@/components/auth/role-guard"

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard requiredRole="patient">{children}</RoleGuard>
}
