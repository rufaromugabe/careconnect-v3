import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/lib/supabase"

export function cn(...inputs: (string | boolean | undefined)[]) {
  return twMerge(clsx(inputs))
}

export const persistSession = async (session: { user: { id: any; user_metadata: { role: any } } }) => {
  // Log that we received a session
  console.log("Persisting session:", session?.user?.id || "No session")
  
  
  if (session?.user?.id && session?.user) {
    // If the user doesn't have role metadata but has a session,
    // attempt to get the role from the database
    if (!session.user.user_metadata?.role) {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single()
        
        if (!error && data?.role) {
          // Update the user's metadata with the role
          await supabase.auth.updateUser({
            data: { role: data.role }
          })
          console.log("Updated user metadata with role:", data.role)
        }
      } catch (error) {
        console.error("Error fetching user role:", error)
      }
    }
  }
}
