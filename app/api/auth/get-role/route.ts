import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    // First try with the regular client (subject to RLS)
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verify the current user's session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }

    // Check if user is requesting their own role (allowed by RLS)
    const isSelf = session.user.id === userId

    // Try to get the role with the regular client first (will work if RLS allows it)
    const { data: rlsData, error: rlsError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single()

    if (!rlsError && rlsData?.role) {
      // Set the role cookie for future use
      cookieStore.set("user_role", rlsData.role, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: false,
        sameSite: "lax",
      })

      return NextResponse.json({ role: rlsData.role })
    }

    // If not requesting own role or RLS error, try with admin client if available
    if (supabaseAdmin) {
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single()

      if (adminError) {
        // Check user metadata as fallback
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

        if (!userError && userData?.user?.user_metadata?.role) {
          const metadataRole = userData.user.user_metadata.role

          // Set the role cookie for future use
          cookieStore.set("user_role", metadataRole, {
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            httpOnly: false,
            sameSite: "lax",
          })

          return NextResponse.json({ role: metadataRole })
        }

        if (userError) {
          return NextResponse.json({ error: `User fetch failed: ${userError.message}` }, { status: 500 })
        }

        return NextResponse.json({ error: `Role fetch failed: ${adminError.message}` }, { status: 500 })
      }

      if (adminData?.role) {
        // Set the role cookie for future use
        cookieStore.set("user_role", adminData.role, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          httpOnly: false,
          sameSite: "lax",
        })

        return NextResponse.json({ role: adminData.role })
      }
    }

    return NextResponse.json({ role: null })
  } catch (error) {
    console.error("API get-role - Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
