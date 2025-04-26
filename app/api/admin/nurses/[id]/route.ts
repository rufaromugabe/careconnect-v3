import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// DELETE handler to delete a nurse
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Extract the token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Invalid token format" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 })
    }

    // Create Supabase admin client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Verify the user is a super-admin
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError) {
      console.error("Auth error:", userError)
      return NextResponse.json({ error: "Authentication error" }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.user_metadata?.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized: Not a super admin" }, { status: 403 })
    }

    // Ensure we have a valid nurse ID
    const nurseId = params.id
    if (!nurseId) {
      return NextResponse.json({ error: "Missing nurse ID" }, { status: 400 })
    }

    // First, get the nurse record to find the associated user_id
    const { data: nurseData, error: nurseError } = await supabaseAdmin
      .from("nurses")
      .select("user_id")
      .eq("id", nurseId)
      .single()

    if (nurseError) {
      console.error("Nurse fetch error:", nurseError)
      return NextResponse.json({ error: nurseError.message || "Failed to fetch nurse" }, { status: 500 })
    }

    if (!nurseData) {
      return NextResponse.json({ error: "Nurse not found" }, { status: 404 })
    }

    // Delete the nurse record
    const { error: deleteNurseError } = await supabaseAdmin.from("nurses").delete().eq("id", nurseId)

    if (deleteNurseError) {
      console.error("Nurse delete error:", deleteNurseError)
      return NextResponse.json({ error: deleteNurseError.message || "Failed to delete nurse" }, { status: 500 })
    }

    // Optionally, delete the user account as well
    // Uncomment if you want to delete the user account when deleting a nurse
    /*
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(nurseData.user_id)
    if (deleteUserError) {
      console.error("User delete error:", deleteUserError)
      return NextResponse.json({ 
        success: true, 
        warning: `Nurse deleted but failed to delete user account: ${deleteUserError.message}` 
      })
    }
    */

    return NextResponse.json({ success: true, message: "Nurse deleted successfully" })
  } catch (err: any) {
    console.error("DELETE error:", err)
    return NextResponse.json({ error: err.message || "Unknown server error" }, { status: 500 })
  }
}
