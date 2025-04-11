import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { userId, role, name } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error("Service role client not available")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // First check if a user role already exists
    const { data: existingRole, error: checkError } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (checkError && !checkError.message.includes("No rows found")) {
      console.error("Error checking existing user role:", checkError)
      return NextResponse.json({ error: `Role check failed: ${checkError.message}` }, { status: 500 })
    }

    // If role exists, update it; otherwise insert a new one
    let roleError = null
    if (existingRole) {
      console.log("User role already exists, updating...")
      const { error } = await supabaseAdmin.from("user_roles").update({ role }).eq("user_id", userId)
      roleError = error
    } else {
      console.log("Creating new user role...")
      const { error } = await supabaseAdmin.from("user_roles").insert([
        {
          user_id: userId,
          role: role,
        },
      ])
      roleError = error
    }

    if (roleError) {
      console.error("Error managing user role:", roleError)
      return NextResponse.json({ error: `Role management failed: ${roleError.message}` }, { status: 500 })
    }

    // Check if role-specific record already exists
    let specificRecordExists = false
    if (role === "doctor") {
      const { data, error } = await supabaseAdmin.from("doctors").select("*").eq("user_id", userId).single()
      specificRecordExists = !!data && !error
    } else if (role === "nurse") {
      const { data, error } = await supabaseAdmin.from("nurses").select("*").eq("user_id", userId).single()
      specificRecordExists = !!data && !error
    } else if (role === "patient") {
      const { data, error } = await supabaseAdmin.from("patients").select("*").eq("user_id", userId).single()
      specificRecordExists = !!data && !error
    } else if (role === "pharmacist") {
      const { data, error } = await supabaseAdmin.from("pharmacists").select("*").eq("user_id", userId).single()
      specificRecordExists = !!data && !error
    }

    // Create role-specific entry if it doesn't exist
    let specificRoleError = null
    if (!specificRecordExists) {
      if (role === "doctor") {
        const { error } = await supabaseAdmin.from("doctors").insert([
          {
            user_id: userId,
            license_number: "PENDING",
            specialization: "General",
          },
        ])
        specificRoleError = error
      } else if (role === "nurse") {
        const { error } = await supabaseAdmin.from("nurses").insert([
          {
            user_id: userId,
            license_number: "PENDING",
            department: "General",
          },
        ])
        specificRoleError = error
      } else if (role === "patient") {
        const { error } = await supabaseAdmin.from("patients").insert([
          {
            user_id: userId,
            dob: new Date().toISOString(),
          },
        ])
        specificRoleError = error
      } else if (role === "pharmacist") {
        const { error } = await supabaseAdmin.from("pharmacists").insert([
          {
            user_id: userId,
            license_number: "PENDING",
          },
        ])
        specificRoleError = error
      }

      if (specificRoleError) {
        console.error(`Error creating ${role} record:`, specificRoleError)
        return NextResponse.json(
          { error: `${role} record creation failed: ${specificRoleError.message}` },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in create-role API route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
