"use client"

import type React from "react"

import { RoleGuard } from "@/components/auth/role-guard"

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard requiredRole="super-admin">{children}</RoleGuard>
}
