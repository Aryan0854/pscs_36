const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gzfblduetdukuxaholhf.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZmJsZHVldGR1a3V4YWhvbGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjExMTAsImV4cCI6MjA3MDczNzExMH0.phwnNUNYk1sPk8MUerkhhYD8Nc3vAwjwsDQ9SrE_A5Y'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testProjectsInsert() {
  try {
    console.log('Testing projects table insert...')
    
    // Test inserting a sample project
    const projectData = {
      title: 'Test Project',
      description: 'Test project for debugging upload issues',
      file_name: 'test.txt',
      file_type: 'text/plain',
      file_size: 1000,
      extracted_text: 'This is a test document for debugging purposes.',
      status: 'testing'
    }
    
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()
    
    if (error) {
      console.error('Projects insert error:', error)
      return false
    }
    
    console.log('Projects insert successful!')
    console.log('Inserted project:', data)
    
    // Clean up - delete the test project
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', data.id)
    
    if (deleteError) {
      console.error('Error cleaning up test project:', deleteError)
    } else {
      console.log('Test project cleaned up successfully')
    }
    
    return true
  } catch (error) {
    console.error('Error testing projects insert:', error)
    return false
  }
}

testProjectsInsert().then(success => {
  if (success) {
    console.log('Projects insert test passed')
  } else {
    console.log('Projects insert test failed')
  }
})