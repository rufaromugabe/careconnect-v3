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
            name: "Unknown",
            email: "No email",
            license_number: doctor.license_number,
            specialization: doctor.specialization,
            hospital_id: doctor.hospital_id,
            hospital_name: doctor.hospitals?.name || "Not Assigned",
            created_at: doctor.created_at,
          }
        }

        const { user: doctorUser } = userData
        
        return {
          id: doctor.id,
          name: doctorUser.user_metadata?.full_name || doctorUser.user_metadata?.name || "Unknown",
          email: doctorUser.email || "No email",
          license_number: doctor.license_number,
          specialization: doctor.specialization,
          hospital_id: doctor.hospital_id,
          hospital_name: doctor.hospitals?.name || "Not Assigned",
          created_at: doctor.created_at,
        }
      })
    )

    return NextResponse.json(doctorsWithUserInfo)
  } catch (error: any) {
    console.error("Error in GET /api/admin/doctors:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST handler to create a new doctor
export async function POST(request: NextRequest) {
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

    // Get the request body
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.specialization || !body.license_number) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // First, create a new user account for the doctor
    const { data: newUser, error: userCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      email_confirm: true,
      user_metadata: {
        full_name: body.name,
        role: "doctor",
        profile_completed: false,
      },
      password: Math.random().toString(36).slice(-8), // Generate a random password
    })

    if (userCreateError) {
      console.error("Error creating user for doctor:", userCreateError)
      return NextResponse.json({ error: `Failed to create user: ${userCreateError.message}` }, { status: 500 })
    }

    // Create the doctor record
    const { data: doctor, error } = await supabaseAdmin
      .from("doctors")
      .insert([
        {
          user_id: newUser.user.id,
          license_number: body.license_number,
          specialization: body.specialization,
          hospital_id: body.hospital_id === "not_assigned" ? null : body.hospital_id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating doctor:", error)
      return NextResponse.json({ error: `Failed to create doctor: ${error.message}` }, { status: 500 })
    }

    // Add the doctor role to the user_roles table
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert([{ user_id: newUser.user.id, role: "doctor" }])

    if (roleError) {
      console.error("Error adding doctor role:", roleError)
      // Continue anyway as the role might have been added by a trigger
    }

    return NextResponse.json({
      ...doctor,
      name: body.name,
      email: body.email,
    })
  } catch (error: any) {
    console.error("Error in POST /api/admin/doctors:", error)
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
