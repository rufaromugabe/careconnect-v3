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

// GET handler to fetch all pharmacies
export async function GET(request: NextRequest) {
  try {
    // Get the authorization token from the request headers
    const token = request.headers.get("authorization")?.split("Bearer ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 })
    }

    // Validate that the user is a super admin
    const { supabaseAdmin } = await validateSuperAdmin(token)

    // Fetch all pharmacies from the database
    const { data: pharmacies, error } = await supabaseAdmin
      .from("pharmacies")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching pharmacies:", error)
      return NextResponse.json({ error: "Failed to fetch pharmacies" }, { status: 500 })
    }

    return NextResponse.json(pharmacies)
  } catch (error: any) {
    console.error("Error in GET /api/admin/pharmacies:", error)
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

// POST handler to create a new pharmacy
export async function POST(request: NextRequest) {
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

    // Create the pharmacy record
    const { data: pharmacy, error } = await supabaseAdmin
      .from("pharmacies")
      .insert([
        {
          name: body.name,
          location: body.location,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating pharmacy:", error)
      return NextResponse.json({ error: "Failed to create pharmacy" }, { status: 500 })
    }

    return NextResponse.json(pharmacy)
  } catch (error: any) {
    console.error("Error in POST /api/admin/pharmacies:", error)
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
