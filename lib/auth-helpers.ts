import { cookies } from "next/headers"
import { supabaseAdmin } from "./supabase"

export async function validateSuperAdmin(request: Request) {
  try {
    // Get the auth token from cookies
    const cookieStore = cookies()
    const supabaseAuthToken = (await cookieStore).get("sb-access-token")?.value

    if (!supabaseAuthToken) {
      console.log("No auth token found in cookies")
      return { error: "Unauthorized: No auth token" }
    }

    if (!supabaseAdmin) {
      console.log("Admin client not available")
      return { error: "Admin client not available" }
    }

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(supabaseAuthToken)

    if (userError || !user) {
      console.log("Authentication failed:", userError)
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
        console.log("User is not a super admin:", user.id)
        return { error: "Unauthorized: Not a super admin" }
      }
    }

    return { user }
  } catch (error) {
    console.error("Error validating super admin:", error)
    return { error: "Authentication validation failed" }
  }
}
