import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"
import type { Database } from "@/types/supabase"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      // Clear any existing role cookie
      cookieStore.set("user_role", "", {
        path: "/",
        maxAge: 0,
        httpOnly: false,
        sameSite: "lax",
      })

      // Try to get the user's role
      let role = null

      // First check user metadata
      if (session.user.user_metadata?.role) {
        role = session.user.user_metadata.role
      } else {
        // Try to get from database
        try {
          const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single()

          if (!error && data?.role) {
            role = data.role
          }
        } catch (error) {
          console.error("Callback route - Error getting role from database:", error)
        }
      }

      // Set the role cookie if we found a role
      if (role) {
        cookieStore.set("user_role", role, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          httpOnly: false,
          sameSite: "lax",
        })
      }

      // Set user ID cookie for comparison
      cookieStore.set("sb-user-id", session.user.id, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: false,
        sameSite: "lax",
      })
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + "/dashboard")
}
