import { supabase } from "./supabase"


export async function logAction(
  userId: string,
  action: string,
  metadata: object = {}
) {
  const { error } = await supabase.from('system_logs').insert([
    {
      user_id: userId,
      action,
      metadata,
    },
  ])

  if (error) {
    console.error('Log insert error:', error.message)
  }
}
