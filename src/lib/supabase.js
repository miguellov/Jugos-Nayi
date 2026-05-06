import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Cliente Supabase; null si faltan variables (modo solo local). */
export const supabase =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true } }) : null

export function isSupabaseConfigured() {
  return Boolean(supabase)
}
