"use client"

import type React from "react"

import { RoleGuard } from "@/components/auth/role-guard"

export default function NurseLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard requiredRole="nurse">{children}</RoleGuard>
}
