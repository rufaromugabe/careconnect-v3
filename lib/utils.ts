import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const persistSession = (session) => {
  // Clear any existing cookies first to ensure we don't have stale data
  document.cookie = "supabase-auth-session-active=; path=/; max-age=0; SameSite=Lax"

  // Set a cookie to indicate active session
  document.cookie = `supabase-auth-session-active=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

  // Store the user ID in a cookie for comparison
  if (session?.user?.id) {
    document.cookie = `sb-user-id=${session.user.id}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
  }

  console.log("Persisting session:", session)
}
