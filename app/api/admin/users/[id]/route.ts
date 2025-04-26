import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// PUT handler to toggle is_active directly on user_metadata
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
      const token = request.headers.get("authorization")?.split("Bearer ")[1]
      if (!token) return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 })
  
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
  
      const {
        data: { user },
        error: userError,
      } = await supabaseAdmin.auth.getUser(token)
  
      if (userError || !user || user.user_metadata?.role !== "super-admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
  
      const body = await request.json()
      const { is_active } = body
  
      if (typeof is_active !== "boolean") {
        return NextResponse.json({ error: "Missing or invalid is_active" }, { status: 400 })
      }
      
      // Ensure params.id is properly awaited
      const userId = await params.id
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          is_active,
        },
      })
  
      if (updateError) {
        return NextResponse.json({ error: "Failed to update user metadata" }, { status: 500 })
      }
  
      return NextResponse.json({ success: true, updated_is_active: is_active })
    } catch (err: any) {
      console.error("PUT error:", err)
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

