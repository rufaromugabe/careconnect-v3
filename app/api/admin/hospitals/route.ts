import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateSuperAdmin } from "@/lib/admin-helpers"

// Create a Supabase client with the service role key for admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    // Validate super admin
    const { user, error: authError } = await validateSuperAdmin(token)

    if (authError || !user) {
      return NextResponse.json({ error: authError || "Authentication failed" }, { status: 401 })
    }

    // Fetch all hospitals
    const { data, error } = await supabaseAdmin.from("hospitals").select("*").order("name", { ascending: true })

    if (error) {
      return NextResponse.json({ error: `Failed to fetch hospitals: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in hospitals GET API route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// POST create a new hospital
export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    // Validate super admin
    const { user, error: authError } = await validateSuperAdmin(token)

    if (authError || !user) {
      return NextResponse.json({ error: authError || "Authentication failed" }, { status: 401 })
    }

    // Get hospital data from request
    const hospitalData = await request.json()

    // Validate required fields
    if (!hospitalData.name || !hospitalData.location) {
      return NextResponse.json({ error: "Name and location are required" }, { status: 400 })
    }

    // Create the hospital
    const { data, error } = await supabaseAdmin
      .from("hospitals")
      .insert([
        {
          name: hospitalData.name,
          location: hospitalData.location,
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: `Failed to create hospital: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error("Error in hospitals POST API route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
