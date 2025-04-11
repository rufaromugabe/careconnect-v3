import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// GET handler to fetch a specific doctor
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Fetch the doctor from the database
    const { data: doctor, error } = await supabaseAdmin
      .from("doctors")
      .select(`
        id,
        user_id,
        license_number,
        specialization,
        hospital_id,
        hospitals:hospital_id (id, name),
        created_at,
        users:user_id (
          id,
          email,
          user_metadata
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching doctor:", error)
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
      }
      return NextResponse.json({ error: `Failed to fetch doctor: ${error.message}` }, { status: 500 })
    }

    // Format the doctor data
    const formattedDoctor = {
      id: doctor.id,
      user_id: doctor.user_id,
      name: doctor.users?.user_metadata?.full_name || doctor.users?.user_metadata?.name || "Unknown",
      email: doctor.users?.email || "No email",
      license_number: doctor.license_number,
      specialization: doctor.specialization,
      hospital_id: doctor.hospital_id,
      hospital_name: doctor.hospitals?.name || "Not Assigned",
      created_at: doctor.created_at,
    }

    return NextResponse.json(formattedDoctor)
  } catch (error: any) {
    console.error("Error in GET /api/admin/doctors/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

// PUT handler to update a doctor
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // First, get the doctor to find the user_id
    const { data: existingDoctor, error: fetchError } = await supabaseAdmin
      .from("doctors")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      console.error("Error fetching doctor:", fetchError)
      return NextResponse.json({ error: `Failed to fetch doctor: ${fetchError.message}` }, { status: 500 })
    }

    // Update the user metadata
    const { error: userUpdateError } = await supabaseAdmin.auth.admin.updateUserById(existingDoctor.user_id, {
      email: body.email,
      user_metadata: {
        full_name: body.name,
        role: "doctor",
      },
    })

    if (userUpdateError) {
      console.error("Error updating user:", userUpdateError)
      return NextResponse.json({ error: `Failed to update user: ${userUpdateError.message}` }, { status: 500 })
    }

    // Update the doctor record
    const { data: doctor, error } = await supabaseAdmin
      .from("doctors")
      .update({
        license_number: body.license_number,
        specialization: body.specialization,
        hospital_id: body.hospital_id === "not_assigned" ? null : body.hospital_id,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating doctor:", error)
      return NextResponse.json({ error: `Failed to update doctor: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({
      ...doctor,
      name: body.name,
      email: body.email,
    })
  } catch (error: any) {
    console.error("Error in PUT /api/admin/doctors/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

// DELETE handler to delete a doctor
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // First, get the doctor to find the user_id
    const { data: existingDoctor, error: fetchError } = await supabaseAdmin
      .from("doctors")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      console.error("Error fetching doctor:", fetchError)
      return NextResponse.json({ error: `Failed to fetch doctor: ${fetchError.message}` }, { status: 500 })
    }

    // Delete the doctor record
    const { error } = await supabaseAdmin.from("doctors").delete().eq("id", params.id)

    if (error) {
      console.error("Error deleting doctor:", error)
      return NextResponse.json({ error: `Failed to delete doctor: ${error.message}` }, { status: 500 })
    }

    // Delete the user record
    const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(existingDoctor.user_id)

    if (userDeleteError) {
      console.error("Error deleting user:", userDeleteError)
      return NextResponse.json({ error: `Failed to delete user: ${userDeleteError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in DELETE /api/admin/doctors/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
