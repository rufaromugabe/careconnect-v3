import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { is } from "date-fns/locale"

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

    if (role == "patient" || role == "Patient") {
      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { role, profile_completed: false, is_verified: true, is_active: true },
      })
      if (metadataError) {
        console.error("Error updating user metadata:", metadataError)
        // Continue anyway, as the database role is more important
      }
    }
    else {
      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { role, profile_completed: false, is_verified: false, is_active: true },
      })
      if (metadataError) {
        console.error("Error updating user metadata:", metadataError)
        // Continue anyway, as the database role is more important
      }
    }
    

    

    // First check if a user role already exists - use a transaction for atomicity
    const { data, error } = await supabaseAdmin.rpc("upsert_user_role", {
      p_user_id: userId,
      p_role: role,
      
    })

    if (error) {
      console.error("Error upserting user role:", error)
      return NextResponse.json({ error: `Role management failed: ${error.message}` }, { status: 500 })
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
    if (!specificRecordExists) {
      let specificRoleError = null

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
