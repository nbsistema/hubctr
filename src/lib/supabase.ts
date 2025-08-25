import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Supabase URL ou Anon Key não configurados.")
}

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
