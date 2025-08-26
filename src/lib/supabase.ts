import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Pega as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas!')
}

// Cliente padrão para usar na aplicação
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)
