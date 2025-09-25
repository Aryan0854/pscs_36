import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
  try {
    const { text, gender, voiceType } = await request.json()

    if (!text || !gender || !voiceType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Create a temporary text file for the sample
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const sampleId = `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const textFilePath = path.join(tempDir, `${sampleId}.txt`)
    const audioFilePath = path.join(process.cwd(), '5(Audio)', 'outputs', 'audio', `${sampleId}_sample.wav`)

    // Write the sample text to file
    fs.writeFileSync(textFilePath, text)

    // Run Python script to generate voice sample
    const sampleScriptPath = path.join(process.cwd(), '5(Audio)', 'generate_sample.py')

    return new Promise((resolve) => {
      const pythonProcess = spawn('python', [sampleScriptPath, textFilePath, gender, voiceType, audioFilePath], {
        cwd: path.join(process.cwd(), '5(Audio)'),
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let output = ''
      let errorOutput = ''

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on('close', (code) => {
        // Clean up temp text file
        try {
          fs.unlinkSync(textFilePath)
        } catch (e) {
          console.error('Failed to clean up temp text file:', e)
        }

        if (code === 0) {
          // Return the audio file URL
          const audioUrl = `/api/audio/download/${sampleId}_sample.wav`
          resolve(NextResponse.json({
            success: true,
            audioUrl: audioUrl,
            sampleId: sampleId
          }))
        } else {
          resolve(NextResponse.json({
            error: 'Voice sample generation failed',
            details: errorOutput
          }, { status: 500 }))
        }
      })

      // Set a timeout for sample generation
      setTimeout(() => {
        pythonProcess.kill()
        resolve(NextResponse.json({
          error: 'Voice sample generation timed out'
        }, { status: 500 }))
      }, 30000) // 30 second timeout
    })

  } catch (error) {
    console.error('Voice sample error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}