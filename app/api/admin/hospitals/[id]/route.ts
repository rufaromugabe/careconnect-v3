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

// GET a specific hospital
export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    const id = params.id

    // Fetch the hospital
    const { data, error } = await supabaseAdmin.from("hospitals").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Hospital not found" }, { status: 404 })
      }
      return NextResponse.json({ error: `Failed to fetch hospital: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in hospital GET API route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// PUT update a hospital
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const id = params.id

    // Get hospital data from request
    const hospitalData = await request.json()

    // Validate required fields
    if (!hospitalData.name || !hospitalData.location) {
      return NextResponse.json({ error: "Name and location are required" }, { status: 400 })
    }

    // Update the hospital
    const { data, error } = await supabaseAdmin
      .from("hospitals")
      .update({
        name: hospitalData.name,
        location: hospitalData.location,
      })
      .eq("id", id)
      .select()

    if (error) {
      return NextResponse.json({ error: `Failed to update hospital: ${error.message}` }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in hospital PUT API route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// DELETE a hospital
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    const id = params.id

    // Delete the hospital
    const { error } = await supabaseAdmin.from("hospitals").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: `Failed to delete hospital: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in hospital DELETE API route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
