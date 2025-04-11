"use client"

import type React from "react"

import { RoleGuard } from "@/components/auth/role-guard"

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard requiredRole="doctor">{children}</RoleGuard>
}
