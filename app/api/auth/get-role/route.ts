import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    console.log("API get-role - Request received for userId:", userId)

    if (!userId) {
      console.log("API get-role - Missing userId in request")
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    // First try with the regular client (subject to RLS)
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verify the current user's session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log("API get-role - Session exists:", !!session)

    if (!session) {
      console.log("API get-role - No active session")
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }

    console.log("API get-role - Session user ID:", session.user.id)
    console.log("API get-role - Requested user ID:", userId)

    // Check if user is requesting their own role (allowed by RLS)
    const isSelf = session.user.id === userId
    console.log("API get-role - User is requesting their own role:", isSelf)

    // Try to get the role with the regular client first (will work if RLS allows it)
    console.log("API get-role - Attempting to fetch role with regular client (RLS)")
    const { data: rlsData, error: rlsError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single()

    if (!rlsError && rlsData?.role) {
      console.log("API get-role - Successfully fetched role with RLS:", rlsData.role)
      return NextResponse.json({ role: rlsData.role })
    }

    if (rlsError) {
      console.log("API get-role - RLS query error:", rlsError.message)

      // If not requesting own role or RLS error, try with admin client if available
      if (supabaseAdmin) {
        console.log("API get-role - Attempting to fetch role with admin client (bypass RLS)")
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .single()

        if (adminError) {
          console.log("API get-role - Admin client error:", adminError.message)

          // Check user metadata as fallback
          console.log("API get-role - Checking user metadata as fallback")
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

          if (!userError && userData?.user?.user_metadata?.role) {
            const metadataRole = userData.user.user_metadata.role
            console.log("API get-role - Found role in user metadata:", metadataRole)
            return NextResponse.json({ role: metadataRole })
          }

          if (userError) {
            console.log("API get-role - User metadata fetch error:", userError.message)
          }

          return NextResponse.json({ error: `Role fetch failed: ${adminError.message}` }, { status: 500 })
        }

        if (adminData?.role) {
          console.log("API get-role - Successfully fetched role with admin client:", adminData.role)
          return NextResponse.json({ role: adminData.role })
        }
      } else {
        console.log("API get-role - Admin client not available, cannot bypass RLS")
      }
    }

    console.log("API get-role - No role found for user")
    return NextResponse.json({ role: null })
  } catch (error) {
    console.error("API get-role - Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
