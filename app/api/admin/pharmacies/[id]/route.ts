import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Function to validate if the user is a super admin
async function validateSuperAdmin(token: string) {
  // Create a Supabase client with the admin key
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
    throw new Error("Unauthorized: Invalid token")
  }

  // Check if the user has the super-admin role
  if (user.user_metadata?.role !== "super-admin") {
    throw new Error("Unauthorized: User is not a super admin")
  }

  return { user, supabaseAdmin }
}

// GET handler to fetch a specific pharmacy
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the authorization token from the request headers
    const token = request.headers.get("authorization")?.split("Bearer ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 })
    }

    // Validate that the user is a super admin
    const { supabaseAdmin } = await validateSuperAdmin(token)

    // Fetch the pharmacy from the database
    const { data: pharmacy, error } = await supabaseAdmin.from("pharmacies").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Error fetching pharmacy:", error)
      return NextResponse.json({ error: "Failed to fetch pharmacy" }, { status: 500 })
    }

    if (!pharmacy) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 })
    }

    return NextResponse.json(pharmacy)
  } catch (error: any) {
    console.error("Error in GET /api/admin/pharmacies/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

// PUT handler to update a pharmacy
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the authorization token from the request headers
    const token = request.headers.get("authorization")?.split("Bearer ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 })
    }

    // Validate that the user is a super admin
    const { supabaseAdmin } = await validateSuperAdmin(token)

    // Get the request body
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update the pharmacy record
    const { data: pharmacy, error } = await supabaseAdmin
      .from("pharmacies")
      .update({
        name: body.name,
        location: body.location,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating pharmacy:", error)
      return NextResponse.json({ error: "Failed to update pharmacy" }, { status: 500 })
    }

    return NextResponse.json(pharmacy)
  } catch (error: any) {
    console.error("Error in PUT /api/admin/pharmacies/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

// DELETE handler to delete a pharmacy
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the authorization token from the request headers
    const token = request.headers.get("authorization")?.split("Bearer ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 })
    }

    // Validate that the user is a super admin
    const { supabaseAdmin } = await validateSuperAdmin(token)

    // Delete the pharmacy record
    const { error } = await supabaseAdmin.from("pharmacies").delete().eq("id", params.id)

    if (error) {
      console.error("Error deleting pharmacy:", error)
      return NextResponse.json({ error: "Failed to delete pharmacy" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in DELETE /api/admin/pharmacies/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
