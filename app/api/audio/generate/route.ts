import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
  try {
    console.log("Audio generation API called")
    const formData = await request.formData()
    const text = formData.get('text') as string
    const personasJson = formData.get('personas') as string
    const numHosts = formData.get('numHosts') as string

    console.log("Text received:", text?.substring(0, 100) + "...")
    console.log("Personas config:", personasJson)
    console.log("Number of hosts:", numHosts)

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
      args.push(personasJson)
    }

    console.log("Command: python", args)

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

      pythonProcess.on('close', (code) => {
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
            resolve(NextResponse.json({
              success: true,
              audioUrl: result.audio_file ? `/api/audio/download/${result.audio_file}` : null,
              transcriptUrl: result.transcript_file ? `/api/audio/download/${result.transcript_file}` : null,
              dialogue: result.dialogue,
              summary: result.summary,
              personas: result.personas
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

      // Send the file path to the Python script
      pythonProcess.stdin.write(filePath + '\n')
      pythonProcess.stdin.end()
    })

  } catch (error) {
    console.error('Audio generation error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}