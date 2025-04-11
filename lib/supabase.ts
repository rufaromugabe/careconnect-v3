import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check for required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  // In development, show a more helpful error
  if (process.env.NODE_ENV === "development") {
    console.error(
      "Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.",
    )
  }
}

// Create a standard client with anonymous key, with fallback empty strings to prevent runtime errors
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Create an admin client with service role key (only available on the server)
// Only create supabaseAdmin when running on the server
export const supabaseAdmin =
  typeof window === "undefined"
    ? createClient(supabaseUrl || "", supabaseServiceRoleKey || "", {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null

// For client-side admin operations (with proper authentication)
export function createAdminClient(accessToken: string) {
  return createClient(supabaseUrl || "", supabaseAnonKey || "", {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}
