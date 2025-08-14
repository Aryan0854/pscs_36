import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const supabaseUrl = "https://gzfblduetdukuxaholhf.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZmJsZHVldGR1a3V4YWhvbGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjExMTAsImV4cCI6MjA3MDczNzExMH0.phwnNUNYk1sPk8MUerkhhYD8Nc3vAwjwsDQ9SrE_A5Y"

// Check if Supabase environment variables are available
export const isSupabaseConfigured = true

// Create a singleton instance of the Supabase client for Client Components
export const supabase = createClientComponentClient({
  supabaseUrl,
  supabaseKey: supabaseAnonKey,
})
