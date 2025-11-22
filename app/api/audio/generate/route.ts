import { NextRequest, NextResponse } from 'next/server'
import { spawn, spawnSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log("Audio generation API called")
    
    let text = ''
    let personasJson = ''
    let numHosts = ''
    let discussionTime = ''
    let projectId = '' // Add project ID
    let language = 'en' // Default to English
    
    // Check if the request is FormData or JSON
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData
      const formData = await request.formData()
      text = formData.get('text') as string || ''
      personasJson = formData.get('personas') as string || ''
      numHosts = formData.get('numHosts') as string || ''
      discussionTime = formData.get('discussionTime') as string || ''
      projectId = formData.get('projectId') as string || '' // Get project ID
      language = formData.get('language') as string || 'en' // Get language
    } else if (contentType.includes('application/json')) {
      // Handle JSON
      const jsonData = await request.json()
      text = jsonData.text || ''
      personasJson = jsonData.personas || ''
      numHosts = jsonData.numHosts || ''
      discussionTime = jsonData.discussionTime || ''
      projectId = jsonData.projectId || '' // Get project ID
      language = jsonData.language || 'en' // Get language
    } else {
      // Fallback to try FormData
      try {
        const formData = await request.formData()
        text = formData.get('text') as string || ''
        personasJson = formData.get('personas') as string || ''
        numHosts = formData.get('numHosts') as string || ''
        discussionTime = formData.get('discussionTime') as string || ''
        projectId = formData.get('projectId') as string || '' // Get project ID
        language = formData.get('language') as string || 'en' // Get language
      } catch (e) {
        // If both fail, return error
        console.log("Failed to parse request body as either FormData or JSON")
        return NextResponse.json({ error: 'Invalid request format' }, { status: 400 })
      }
    }

    console.log("Text received:", text?.substring(0, 100) + "...")
    console.log("Personas config:", personasJson)
    console.log("Number of hosts:", numHosts)
    console.log("Project ID:", projectId) // Log project ID
    console.log("Language setting:", language)

    if (!text || !text.trim()) {
      console.log("No text provided")
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    // Save text to temporary file
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const filePath = path.join(tempDir, `text_${Date.now()}.txt`)
    fs.writeFileSync(filePath, text)

    // Run the Python audio generation script
    const audioScriptPath = path.join(process.cwd(), '5(Audio)', 'process_file.py')
    console.log("Python script path:", audioScriptPath)
    console.log("Working directory:", path.join(process.cwd(), '5(Audio)'))

    const args = [audioScriptPath, filePath]
    if (personasJson) {
      // Ensure personasJson is a JSON string before passing to Python
      let personasString: string;
      if (typeof personasJson === 'string') {
        // If it's already a string, use it as is
        personasString = personasJson;
      } else {
        // If it's an object/array, stringify it
        personasString = JSON.stringify(personasJson);
      }
      args.push(personasString);
    }
    if (discussionTime) {
      // Ensure discussionTime is a string before passing to Python
      args.push(discussionTime.toString());
    }
    
    // Add language parameter
    args.push(language);

    console.log("Command: python", args)

    // Check if Python is available
    try {
      spawnSync('python', ['--version'], { stdio: 'ignore' });
    } catch (pythonError) {
      console.error("Python not found or not accessible:", pythonError);
      return NextResponse.json({
        error: 'Python runtime not available',
        details: 'Audio generation requires Python to be installed and accessible in the system PATH'
      }, { status: 500 });
    }

    return new Promise((resolve) => {
      const pythonProcess = spawn('python', args, {
        cwd: path.join(process.cwd(), '5(Audio)'),
        stdio: ['pipe', 'pipe', 'pipe']
      })

      console.log("Python process started")

      let output = ''
      let errorOutput = ''

      pythonProcess.stdout.on('data', (data) => {
        const dataStr = data.toString()
        console.log("Python stdout:", dataStr)
        output += dataStr
      })

      pythonProcess.stderr.on('data', (data) => {
        const dataStr = data.toString()
        console.log("Python stderr:", dataStr)
        errorOutput += dataStr
      })

      pythonProcess.on('close', async (code) => { // Make this async
        console.log("Python process exited with code:", code)
        // Clean up temp file
        try {
          fs.unlinkSync(filePath)
        } catch (e) {
          console.error('Failed to clean up temp file:', e)
        }

        if (code === 0) {
          try {
            const result = JSON.parse(output)
            
            // Save audio URL to database if project ID is provided and Supabase is configured
            if (projectId && isSupabaseConfigured) {
              try {
                const supabase = await createClient()
                const audioUrl = result.audio_file ? `/api/audio/download/${result.audio_file}` : null
                const { error: updateError } = await supabase
                  .from('projects')
                  .update({ audio_url: audioUrl })
                  .eq('id', projectId)
                
                if (updateError) {
                  console.error('Failed to update project with audio URL:', updateError)
                } else {
                  console.log('Successfully updated project with audio URL:', projectId)
                }
              } catch (dbError) {
                console.error('Database error when saving audio URL:', dbError)
              }
            }
            
            resolve(NextResponse.json({
              success: true,
              audioUrl: result.audio_file ? `/api/audio/download/${result.audio_file}` : null,
              transcriptUrl: result.transcript_file ? `/api/audio/download/${result.transcript_file}` : null,
              dialogue: result.dialogue,
              summary: result.summary,
              personas: result.personas,
              templateUsed: result.template_used // Add template information to response
            }))
          } catch (parseError) {
            resolve(NextResponse.json({
              success: true,
              message: 'Audio generated successfully',
              rawOutput: output
            }))
          }
        } else {
          resolve(NextResponse.json({
            error: 'Audio generation failed',
            details: errorOutput,
            code: code
          }, { status: 500 }))
        }
      })

    })

  } catch (error) {
    console.error('Audio generation error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}