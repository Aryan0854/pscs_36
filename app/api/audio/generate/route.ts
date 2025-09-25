import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
  try {
    console.log("Audio generation API called")
    const formData = await request.formData()
    const file = formData.get('file') as File
    console.log("File received:", file?.name, "Size:", file?.size)

    if (!file) {
      console.log("No file provided")
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Save uploaded file temporarily
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const filePath = path.join(tempDir, `upload_${Date.now()}_${file.name}`)
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filePath, buffer)

    // Run the Python audio generation script
    const audioScriptPath = path.join(process.cwd(), '5(Audio)', 'process_file.py')
    console.log("Python script path:", audioScriptPath)
    console.log("Working directory:", path.join(process.cwd(), '5(Audio)'))
    console.log("Command: python", [audioScriptPath, filePath])

    return new Promise((resolve) => {
      const pythonProcess = spawn('python', [audioScriptPath, filePath], {
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