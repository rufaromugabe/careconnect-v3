import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// GET handler to fetch all nurses
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

    // Fetch all nurses from the database with their user information
    const { data: nurses, error } = await supabaseAdmin
      .from("nurses")
      .select(`
        id,
        user_id,
        license_number,
        department,
        hospital_id,
        hospitals (id, name),
        created_at
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching nurses:", error)
      return NextResponse.json({ error: `Failed to fetch nurses: ${error.message}` }, { status: 500 })
    }

    // Now fetch the user details separately for each nurse using the proper Auth API
    const nursesWithUserInfo = await Promise.all(
      nurses.map(async (nurse) => {
        // Use the admin.getUserById method to get user details properly
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(nurse.user_id)

        if (userError || !userData || !userData.user) {
          console.warn(`Could not fetch user info for nurse ${nurse.id}: ${userError?.message || "No user data"}`)
          return {
            id: nurse.id,
            user_id: nurse.user_id, // Include user_id in the response
            name: "Unknown",
            email: "No email",
            license_number: nurse.license_number,
            department: nurse.department,
            hospital_id: nurse.hospital_id,
            hospital_name: nurse.hospitals?.name || "Not Assigned",
            created_at: nurse.created_at,
            is_verified: false,
          }
        }

        const { user: nurseUser } = userData

        return {
          id: nurse.id,
          user_id: nurse.user_id, // Include user_id in the response
          name: nurseUser.user_metadata?.full_name || nurseUser.user_metadata?.name || "Unknown",
          email: nurseUser.email || "No email",
          license_number: nurse.license_number,
          department: nurse.department,
          hospital_id: nurse.hospital_id,
          hospital_name: nurse.hospitals?.name || "Not Assigned",
          created_at: nurse.created_at,
          is_verified: nurseUser.user_metadata?.is_verified || false,
        }
      }),
    )

    console.log("nursesWithUserInfo", nursesWithUserInfo)
    return NextResponse.json(nursesWithUserInfo)
  } catch (error: any) {
    console.error("Error in GET /api/admin/nurses:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

