"use client"

import Link from "next/link"
import Image from "next/image"
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
  Thermometer,
  Building,
  FlaskRound,
  Stethoscope,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import { motion } from "framer-motion"

interface SidebarProps {
  role: "doctor" | "patient" | "pharmacist" | "super-admin" | "nurse"
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

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
      { href: "/super-admin/doctors", label: "Manage Doctors", icon: Stethoscope },
      { href: "/super-admin/pharmacists", label: "Manage Pharmacists", icon: FlaskRound },
      { href: "/super-admin/nurses", label: "Manage Nurses", icon: Thermometer },
      { href: "/super-admin/pharmacies", label: "Manage Pharmacies", icon: Store },
      { href: "/super-admin/hospitals", label: "Manage Hospitals", icon: Building },
      { href: "/super-admin/users", label: "Manage Users", icon: Users },
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
  
  const roleDisplayName = {
    doctor: "Doctor",
    patient: "Patient",
    pharmacist: "Pharmacist",
    "super-admin": "Admin",
    nurse: "Nurse",
  }

  return (
    <div className={cn(
      "flex flex-col h-full border-r bg-card transition-all duration-300",
      collapsed ? "w-[80px]" : "w-[260px]"
    )}>
      {/* Logo and header section */}
      <div className={cn(
        "flex items-center p-4 border-b",
        collapsed ? "justify-center" : "justify-between px-6"
      )}>
        <Link href={`/${role}/dashboard`} className="flex items-center">
          <div className={cn("relative", collapsed ? "w-10 h-10" : "w-8 h-8 mr-3")}>
            <Image 
              src="/logo.png" 
              alt="CareConnect Logo" 
              fill
              className="object-contain" 
            />
          </div>
          {!collapsed && (
            <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              CareConnect
            </h2>
          )}
        </Link>
        
        {!collapsed && (
          <button 
            onClick={() => setCollapsed(true)} 
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        )}
        
        {collapsed && (
          <button 
            onClick={() => setCollapsed(false)} 
            className="absolute -right-3 top-12 bg-primary text-primary-foreground p-1 rounded-full shadow-md hover:bg-primary/90 transition-colors"
          >
            <ChevronRight size={14} className="rotate-180" />
          </button>
        )}
      </div>
      
      {/* Role badge */}
      {!collapsed && (
        <div className="px-6 py-3">
          <div className="bg-primary/10 text-primary rounded-md px-3 py-1.5 text-sm font-medium">
            {roleDisplayName[role]}
          </div>
        </div>
      )}
      
      {/* Navigation section */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1.5">
          {currentRoutes.map((route) => {
            const Icon = route.icon
            const isActive = pathname === route.href
            
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all relative group",
                  isActive 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="flex items-center justify-center">
                  <Icon className={cn("flex-shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                </div>
                
                {!collapsed && (
                  <span className="truncate">{route.label}</span>
                )}
                
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity text-xs whitespace-nowrap shadow-md z-50">
                    {route.label}
                  </div>
                )}
                
                {isActive && !collapsed && (
                  <motion.div
                    className="absolute left-0 w-1 h-6 bg-primary-foreground rounded-full"
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
      
      {/* Footer section */}
      <div className="p-4 border-t mt-auto">
        <nav className="space-y-1.5">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted transition-all group",
              collapsed ? "justify-center" : ""
            )}
          >
            <Settings className={cn("flex-shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
            {!collapsed && <span>Settings</span>}
            
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity text-xs whitespace-nowrap shadow-md z-50">
                Settings
              </div>
            )}
          </Link>
          
          <button
            onClick={signOut}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-all group",
              collapsed ? "justify-center" : ""
            )}
          >
            <LogOut className={cn("flex-shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
            {!collapsed && <span>Logout</span>}
            
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity text-xs whitespace-nowrap shadow-md z-50 text-destructive">
                Logout
              </div>
            )}
          </button>
        </nav>
      </div>
    </div>
  )
}
