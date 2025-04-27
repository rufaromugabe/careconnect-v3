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

    try {
      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code)

      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
      
        if (!session.user.user_metadata?.role) {
          try {
            const { data, error } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .single()

            if (!error && data?.role) {
              // Update the user metadata to include the role
              await supabase.auth.updateUser({
                data: { role: data.role }
              })
            }
          } catch (error) {
            console.error("Callback route - Error getting role from database:", error)
          }
        }
      }
    } catch (error) {
      console.error("Error in auth callback:", error)
      // Continue to redirect even if there's an error
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + "/dashboard")
}
