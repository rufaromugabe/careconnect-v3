import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { ToastContainer } from 'react-toastify';

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CareConnect",
  description: "A comprehensive healthycare management system",
  generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check for session cookie - using cookies asynchronously
  const cookieStore = cookies()
  // Get cookies asynchronously and safely
  const sessionActiveValue = (await cookieStore).has("supabase-auth-session-active") ? 
    (await cookieStore).get("supabase-auth-session-active")!.value : undefined
  const sessionActive = sessionActiveValue === "true"
  
  let userRoleValue = (await cookieStore).has("user_role") ? 
    (await cookieStore).get("user_role")!.value : undefined
  let userRole = userRoleValue

  console.log("Root Layout - Session active cookie:", sessionActive)
  console.log("Root Layout - User role cookie:", userRole)

  // If session is active but role cookie is undefined, try to get it from the database
  if (sessionActive && !userRole) {
    try {
      // Create a Supabase client
      const supabase = createServerComponentClient({ cookies })

      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user?.id) {
        // Fetch the user's role from the database
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single()

        if (!error && roleData?.role) {
          userRole = roleData.role
          console.log("Root Layout - Fetched role from database:", userRole)

          // Set the role cookie for future requests
          // Note: We can't set cookies in server components directly,
          // but we'll ensure it's set in the auth context and middleware
        }
      }
    } catch (error) {
      console.error("Root Layout - Error fetching user role:", error)
    }
  }

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-50 to-blue-100`}>
        <AuthProvider initialRole={userRole}>{children}</AuthProvider>   <ToastContainer />
      </body>
    </html>
  )
}