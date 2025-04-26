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

    // Fetch the pharmacist from the database
    const { data: pharmacist, error } = await supabaseAdmin
      .from("pharmacists")
      .select(`
        id,
        user_id,
        license_number,
        pharmacy_id,
        pharmacies:pharmacy_id (id, name),
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
      console.error("Error fetching pharmacist:", error)
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Pharmacist not found" }, { status: 404 })
      }
      return NextResponse.json({ error: `Failed to fetch pharmacist: ${error.message}` }, { status: 500 })
    }

    // Format the pharmacist data
    const formattedpharmacist = {
      id: pharmacist.id,
      user_id: pharmacist.user_id,
      name: pharmacist.users?.user_metadata?.full_name || pharmacist.users?.user_metadata?.name || "Unknown",
      email: pharmacist.users?.email || "No email",
      license_number: pharmacist.license_number,
      pharmacy_id: pharmacist.pharmacy_id,
      pharmacy_name: pharmacist.pharmacies?.name || "Not Assigned",
      created_at: pharmacist.created_at,
    }

    return NextResponse.json(formattedpharmacist)
  } catch (error: any) {
    console.error("Error in GET /api/admin/pharmacists/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}