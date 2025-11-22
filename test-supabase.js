const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gzfblduetdukuxaholhf.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZmJsZHVldGR1a3V4YWhvbGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjExMTAsImV4cCI6MjA3MDczNzExMH0.phwnNUNYk1sPk8MUerkhhYD8Nc3vAwjwsDQ9SrE_A5Y'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test database connection by querying a simple table
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }
    
    console.log('Supabase connection successful!')
    console.log('Sample data:', data)
    return true
  } catch (error) {
    console.error('Error testing Supabase connection:', error)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('Database connection test passed')
  } else {
    console.log('Database connection test failed')
  }
})