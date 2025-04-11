import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateSuperAdmin } from "@/lib/admin-helpers"

// Create a Supabase client with the service role key for admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    // Validate super admin
    const { user, error: authError } = await validateSuperAdmin(token)

    if (authError || !user) {
      return NextResponse.json({ error: authError || "Authentication failed" }, { status: 401 })
    }

    // Fetch all users
    const { data: authUsers, error: authError2 } = await supabaseAdmin.auth.admin.listUsers()

    if (authError2) {
      return NextResponse.json({ error: `Failed to fetch users: ${authError2.message}` }, { status: 500 })
    }

    // Get user roles from the database
    const { data: userRoles, error: rolesError } = await supabaseAdmin.from("user_roles").select("user_id, role")

    if (rolesError) {
      return NextResponse.json({ error: `Failed to fetch user roles: ${rolesError.message}` }, { status: 500 })
    }

    // Combine user data with roles
    const users = authUsers.users.map((user) => {
      // First try to get role from metadata
      let role = user.user_metadata?.role

      // If not found, try to get from user_roles table
      if (!role) {
        const userRole = userRoles?.find((r) => r.user_id === user.id)
        role = userRole?.role || "unknown"
      }

      return {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          role,
        },
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error in users API route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
