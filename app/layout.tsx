import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { ToastContainer } from 'react-toastify';
import { ThemeProvider } from "@/components/theme-provider"

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
  // Determine if we have the necessary auth data
  let userRole: string | undefined = undefined

  // Create a Supabase client directly and get session
  try {
    // Create a Supabase client
    const supabase = createServerComponentClient({ cookies })

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user?.id) {
      // Get role directly from user metadata (most efficient)
      if (session.user.user_metadata?.role) {
        userRole = session.user.user_metadata.role
        console.log("Root Layout - Using role from user metadata:", userRole)
      } else {
        // If not in metadata, fetch from database as fallback
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single()

        if (!error && roleData?.role) {
          userRole = roleData.role
          console.log("Root Layout - Fetched role from database:", userRole)
        }
      }
    }
  } catch (error) {
    console.error("Root Layout - Error fetching user role:", error)
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider initialRole={userRole}>
            {children}
          </AuthProvider>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  )
}