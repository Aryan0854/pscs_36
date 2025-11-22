const { createClient } = require('@supabase/supabase-js');

// Use the same environment variables as in your .env.local file
const supabaseUrl = 'https://gzfblduetdukuxaholhf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZmJsZHVldGR1a3V4YWhvbGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjExMTAsImV4cCI6MjA3MDczNzExMH0.phwnNUNYk1sPk8MUerkhhYD8Nc3vAwjwsDQ9SrE_A5Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test project_exports table with date filtering
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    console.log('One week ago:', oneWeekAgo);
    
    const { data: recentExports, error: exportsError } = await supabase
      .from('project_exports')
      .select('processing_time_minutes, completed_at')
      .not('completed_at', 'is', null)
      .gte('completed_at', oneWeekAgo);
    
    if (exportsError) {
      console.error('Exports Error:', exportsError);
    } else {
      console.log('Recent Exports Count:', recentExports.length);
      console.log('Recent Exports Sample:', recentExports.slice(0, 3));
    }
    
    // Get all exports to see the date range
    const { data: allExports, error: allExportsError } = await supabase
      .from('project_exports')
      .select('processing_time_minutes, completed_at')
      .not('completed_at', 'is', null)
      .limit(10);
    
    if (allExportsError) {
      console.error('All Exports Error:', allExportsError);
    } else {
      console.log('All Exports Sample (10):', allExports);
    }
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Connection Error:', error);
  }
}

testConnection();