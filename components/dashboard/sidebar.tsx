"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  FileText,
  Calendar,
  Users,
  Settings,
  LogOut,
  PlusCircle,
  ClipboardList,
  Activity,
  UserPlus,
  Store,
  AlertCircle,
  Thermometer,
  Building,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface SidebarProps {
  role: "doctor" | "patient" | "pharmacist" | "super-admin" | "nurse"
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const routes = {
    doctor: [
      { href: "/doctor/dashboard", label: "Dashboard", icon: Home },
      { href: "/doctor/patients", label: "Patients", icon: Users },
      { href: "/doctor/prescriptions", label: "Prescriptions", icon: FileText },
      { href: "/doctor/appointments", label: "Appointments", icon: Calendar },
      { href: "/doctor/health-records", label: "Health Records", icon: ClipboardList },
    ],
    patient: [
      { href: "/patient/dashboard", label: "Dashboard", icon: Home },
      { href: "/patient/prescriptions", label: "Prescriptions", icon: FileText },
      { href: "/patient/appointments", label: "Appointments", icon: Calendar },
      { href: "/patient/health-records", label: "Health Records", icon: Activity },
    ],
    pharmacist: [
      { href: "/pharmacist/dashboard", label: "Dashboard", icon: Home },
      { href: "/pharmacist/prescriptions", label: "Prescriptions", icon: FileText },
      { href: "/pharmacist/inventory", label: "Inventory", icon: PlusCircle },
    ],
    "super-admin": [
      { href: "/super-admin/dashboard", label: "Dashboard", icon: Home },
      { href: "/super-admin/doctors", label: "Manage Doctors", icon: UserPlus },
      { href: "/super-admin/pharmacies", label: "Manage Pharmacies", icon: Store },
      { href: "/super-admin/users", label: "Manage Users", icon: Users },
      { href: "/super-admin/hospitals", label: "Manage Hospitals", icon: Building }, // Fixed the label
      { href: "/super-admin/alerts", label: "System Alerts", icon: AlertCircle },
      { href: "/super-admin/system-logs", label: "System Logs", icon: Activity },
    ],
    nurse: [
      { href: "/nurse/dashboard", label: "Dashboard", icon: Home },
      { href: "/nurse/health-records", label: "Health Records", icon: ClipboardList },
      { href: "/nurse/vital-signs", label: "Vital Signs", icon: Thermometer },
      { href: "/nurse/patients", label: "Patients", icon: Users },
    ],
  }

  const currentRoutes = routes[role] || []

  return (
    <div className="flex flex-col h-full border-r bg-card">
      <div className="p-6">
        <h2 className="text-lg font-semibold">CareConnect</h2>
      </div>
      <div className="flex-1 px-4">
        <nav className="space-y-2">
          {currentRoutes.map((route) => {
            const Icon = route.icon
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === route.href ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                {route.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="p-4 border-t">
        <nav className="space-y-2">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </nav>
      </div>
    </div>
  )
}
