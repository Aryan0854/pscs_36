const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function initDatabase() {
  try {
    console.log('Initializing database...')
    
    // Read and execute the SQL scripts
    const fs = require('fs')
    const path = require('path')
    
    // Execute projects table script
    const projectsSql = fs.readFileSync(path.join(__dirname, 'scripts', 'create-projects-table.sql'), 'utf8')
    console.log('Creating projects table...')
    // Split the SQL into individual statements
    const statements = projectsSql.split(';').filter(stmt => stmt.trim() !== '')
    for (const statement of statements) {
      if (statement.trim() !== '') {
        try {
          const { error } = await supabase.rpc('execute_sql', { sql: statement.trim() + ';' })
          if (error) {
            console.error('Error executing statement:', error)
          }
        } catch (err) {
          console.log('Statement might not be executable via RPC, continuing...')
        }
      }
    }
    console.log('Projects table script processed')
    
    // Execute project tables script
    const projectTablesSql = fs.readFileSync(path.join(__dirname, 'scripts', 'create-project-tables.sql'), 'utf8')
    console.log('Creating project timeline and scenes tables...')
    const projectTableStatements = projectTablesSql.split(';').filter(stmt => stmt.trim() !== '')
    for (const statement of projectTableStatements) {
      if (statement.trim() !== '') {
        try {
          const { error } = await supabase.rpc('execute_sql', { sql: statement.trim() + ';' })
          if (error) {
            console.error('Error executing statement:', error)
          }
        } catch (err) {
          console.log('Statement might not be executable via RPC, continuing...')
        }
      }
    }
    console.log('Project timeline and scenes tables script processed')
    
    // Execute audio files table script
    const audioFilesSql = fs.readFileSync(path.join(__dirname, 'scripts', 'create-audio-files-table.sql'), 'utf8')
    console.log('Creating audio files table...')
    const audioFilesStatements = audioFilesSql.split(';').filter(stmt => stmt.trim() !== '')
    for (const statement of audioFilesStatements) {
      if (statement.trim() !== '') {
        try {
          const { error } = await supabase.rpc('execute_sql', { sql: statement.trim() + ';' })
          if (error) {
            console.error('Error executing statement:', error)
          }
        } catch (err) {
          console.log('Statement might not be executable via RPC, continuing...')
        }
      }
    }
    console.log('Audio files table script processed')
    
    // Execute user profiles table script
    const userProfilesSql = fs.readFileSync(path.join(__dirname, 'scripts', 'create-user-profiles.sql'), 'utf8')
    console.log('Creating user profiles table...')
    const userProfilesStatements = userProfilesSql.split(';').filter(stmt => stmt.trim() !== '')
    for (const statement of userProfilesStatements) {
      if (statement.trim() !== '') {
        try {
          const { error } = await supabase.rpc('execute_sql', { sql: statement.trim() + ';' })
          if (error) {
            console.error('Error executing statement:', error)
          }
        } catch (err) {
          console.log('Statement might not be executable via RPC, continuing...')
        }
      }
    }
    console.log('User profiles table script processed')
    
    // Execute analytics tables script
    const analyticsSql = fs.readFileSync(path.join(__dirname, 'scripts', 'create-analytics-tables.sql'), 'utf8')
    console.log('Creating analytics tables...')
    const analyticsStatements = analyticsSql.split(';').filter(stmt => stmt.trim() !== '')
    for (const statement of analyticsStatements) {
      if (statement.trim() !== '') {
        try {
          const { error } = await supabase.rpc('execute_sql', { sql: statement.trim() + ';' })
          if (error) {
            console.error('Error executing statement:', error)
          }
        } catch (err) {
          console.log('Statement might not be executable via RPC, continuing...')
        }
      }
    }
    console.log('Analytics tables script processed')
    
    console.log('Database initialization completed')
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

initDatabase()