const { createClient } = require('@supabase/supabase-js');

// Use the same environment variables as in your .env.local file
const supabaseUrl = 'https://gzfblduetdukuxaholhf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZmJsZHVldGR1a3V4YWhvbGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjExMTAsImV4cCI6MjA3MDczNzExMH0.phwnNUNYk1sPk8MUerkhhYD8Nc3vAwjwsDQ9SrE_A5Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDateComparison() {
  try {
    console.log('Testing date comparison logic...');
    
    // Get the processing times data
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: processingTimes, error } = await supabase
      .from('project_exports')
      .select('processing_time_minutes, completed_at')
      .not('completed_at', 'is', null)
      .gte('completed_at', oneWeekAgo);
    
    if (error) {
      console.error('Error fetching data:', error);
      return;
    }
    
    console.log('Total processing times fetched:', processingTimes.length);
    
    // Simulate the date logic from the API
    const processingTimeChart = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayName = date.toLocaleDateString("en", { weekday: "short" });
      
      console.log(`\nChecking ${dayName} (${date.toDateString()})`);
      
      const dayProcessingTimes = processingTimes.filter((pt) => {
        const ptDate = new Date(pt.completed_at);
        const isMatch = ptDate.toDateString() === date.toDateString();
        if (isMatch) {
          console.log(`  Match found: ${pt.processing_time_minutes} minutes at ${pt.completed_at}`);
        }
        return isMatch;
      }) || [];
      
      const avgTime = dayProcessingTimes.length > 0
        ? dayProcessingTimes.reduce((sum, pt) => sum + pt.processing_time_minutes, 0) / dayProcessingTimes.length
        : 0;
      
      console.log(`  Total matches: ${dayProcessingTimes.length}, Average time: ${avgTime}`);
      
      return {
        day: dayName,
        time: Math.round(avgTime),
      };
    });
    
    console.log('\nFinal processing time chart:', processingTimeChart);
  } catch (error) {
    console.error('Error:', error);
  }
}

testDateComparison();