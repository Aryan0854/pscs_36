import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof supabaseUrl === "string" &&
  supabaseUrl.length > 0 &&
  typeof supabaseAnonKey === "string" &&
  supabaseAnonKey.length > 0

// Create a singleton instance of the Supabase client for Client Components
export const supabase = createClientComponentClient()
