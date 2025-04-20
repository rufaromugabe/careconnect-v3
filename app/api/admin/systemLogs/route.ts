import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET handler to fetch all system logs
export async function GET(request: NextRequest) {
  try {
    // Extract Bearer token from Authorization header
    const token = request.headers.get("authorization")?.split("Bearer ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    // Create a Supabase client using the service role key for elevated privileges
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the token to retrieve the user
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    // Only allow access for users with the 'super-admin' role
    if (user.user_metadata?.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: User is not a super-admin" }, { status: 403 });
    }

    // Fetch all system logs, ordered by most recent
    const { data: syslogs, error } = await supabaseAdmin
      .from("system_logs")
      .select(`
        id,
        user_id,
        action,
        timestamp,
        metadata
      `)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching system logs:", error.message);
      return NextResponse.json({ error: `Failed to fetch logs: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(syslogs, { status: 200 });
  } catch (error: any) {
    console.error("Unhandled error in GET /api/admin/systemLogs:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
