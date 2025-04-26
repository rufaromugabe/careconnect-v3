import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// GET handler to fetch all pharmacists
export async function GET(request: NextRequest) {
  try {
    // Get the authorization token from the request headers
    const token = request.headers.get("authorization")?.split("Bearer ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 })
    }

    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify the token and get the user
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 })
    }

    // Check if the user has the super-admin role
    if (user.user_metadata?.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized: User is not a super admin" }, { status: 403 })
    }

    // Fetch all pharmacists from the database with their user information
    const { data: pharmacists, error } = await supabaseAdmin
      .from("pharmacists")
      .select(`
        id,
        user_id,
        license_number,
        pharmacy_id,
        pharmacies (id, name),
        created_at
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching pharmacists:", error)
      return NextResponse.json({ error: `Failed to fetch pharmacists: ${error.message}` }, { status: 500 })
    }

    // Now fetch the user details separately for each pharmacist using the proper Auth API
    const pharmacistsWithUserInfo = await Promise.all(
      pharmacists.map(async (pharmacist) => {
        // Use the admin.getUserById method to get user details properly
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(pharmacist.user_id)

        if (userError || !userData || !userData.user) {
          console.warn(
            `Could not fetch user info for pharmacist ${pharmacist.id}: ${userError?.message || "No user data"}`,
          )
          return {
            id: pharmacist.id,
            user_id: pharmacist.user_id, // Include user_id in the response
            name: "Unknown",
            email: "No email",
            license_number: pharmacist.license_number,
            pharmacy_id: pharmacist.pharmacy_id,
            pharmacy_name: pharmacist.pharmacies?.name || "Not Assigned",
            created_at: pharmacist.created_at,
            is_verified: false,
          }
        }

        const { user: pharmacistUser } = userData

        return {
          id: pharmacist.id,
          user_id: pharmacist.user_id, // Include user_id in the response
          name: pharmacistUser.user_metadata?.full_name || pharmacistUser.user_metadata?.name || "Unknown",
          email: pharmacistUser.email || "No email",
          license_number: pharmacist.license_number,
          pharmacy_id: pharmacist.pharmacy_id,
          pharmacy_name: pharmacist.pharmacies?.name || "Not Assigned",
          created_at: pharmacist.created_at,
          is_verified: pharmacistUser.user_metadata?.is_verified || false,
        }
      }),
    )
    return NextResponse.json(pharmacistsWithUserInfo)
  } catch (error: any) {
    console.error("Error in GET /api/admin/pharmacists:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
