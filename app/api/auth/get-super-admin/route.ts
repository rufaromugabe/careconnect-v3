import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key for admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    // First check if user has super-admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single()

    if (roleError) {
      return NextResponse.json({ error: `Role check failed: ${roleError.message}` }, { status: 500 })
    }

    if (roleData?.role !== "super-admin") {
      return NextResponse.json({ error: "User is not a super admin" }, { status: 403 })
    }

    // Get super admin profile
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("super_admins")
      .select(`
        id,
        access_level,
        managed_entities,
        users:user_id (
          id,
          email,
          user_metadata
        )
      `)
      .eq("user_id", userId)
      .single()

    if (adminError) {
      return NextResponse.json({ error: `Profile fetch failed: ${adminError.message}` }, { status: 500 })
    }

    return NextResponse.json(adminData)
  } catch (error) {
    console.error("Error in get-super-admin API route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
