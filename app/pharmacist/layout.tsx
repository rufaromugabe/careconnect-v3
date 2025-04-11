"use client"

import type React from "react"

import { RoleGuard } from "@/components/auth/role-guard"

export default function PharmacistLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard requiredRole="pharmacist">{children}</RoleGuard>
}
