import { createClient } from '@supabase/supabase-js'

// Variáveis do ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas!')
}

// Exporta o client pronto
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
