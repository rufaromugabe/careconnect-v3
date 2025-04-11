import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key for admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Helper function to validate super admin
export async function validateSuperAdmin(token: string) {
  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return { error: "Authentication failed" }
    }

    // Verify the user is a super admin
    const isSuperAdmin = user.user_metadata?.role === "super-admin"

    if (!isSuperAdmin) {
      // Double-check in the database
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      if (roleError || roleData?.role !== "super-admin") {
        return { error: "Unauthorized: Not a super admin" }
      }
    }

    return { user, supabaseAdmin }
  } catch (error) {
    console.error("Error validating super admin:", error)
    return { error: "Authentication validation failed" }
  }
}
