import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// GET handler to fetch all doctors
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

    // Fetch all doctors from the database with their user information
    const { data: doctors, error } = await supabaseAdmin
      .from("doctors")
      .select(`
        id,
        user_id,
        license_number,
        specialization,
        hospital_id,
        hospitals (id, name),
        created_at
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching doctors:", error)
      return NextResponse.json({ error: `Failed to fetch doctors: ${error.message}` }, { status: 500 })
    }

    // Now fetch the user details separately for each doctor using the proper Auth API
    const doctorsWithUserInfo = await Promise.all(
      doctors.map(async (doctor) => {
        // Use the admin.getUserById method to get user details properly
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(doctor.user_id)

        if (userError || !userData || !userData.user) {
          console.warn(`Could not fetch user info for doctor ${doctor.id}: ${userError?.message || "No user data"}`)
          return {
            id: doctor.id,
            user_id: doctor.user_id,
            name: "Unknown",
            email: "No email",
            license_number: doctor.license_number,
            specialization: doctor.specialization,
            hospital_id: doctor.hospital_id,
            hospital_name: doctor.hospitals?.name || "Not Assigned",
            created_at: doctor.created_at,
            is_verified: false,
          }
        }

        const { user: doctorUser } = userData
        
        return {
          id: doctor.id,
          user_id: doctor.user_id,
          name: doctorUser.user_metadata?.full_name || doctorUser.user_metadata?.name || "Unknown",
          email: doctorUser.email || "No email",
          license_number: doctor.license_number,
          specialization: doctor.specialization,
          hospital_id: doctor.hospital_id,
          hospital_name: doctor.hospitals?.name || "Not Assigned",
          created_at: doctor.created_at,
          is_verified: doctorUser.user_metadata?.is_verified || false,
        }
      })
    )
    return NextResponse.json(doctorsWithUserInfo)
  } catch (error: any) {
    console.error("Error in GET /api/admin/doctors:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
