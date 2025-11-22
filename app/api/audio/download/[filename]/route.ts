import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    const audioDir = path.join(process.cwd(), '5(Audio)', 'outputs', 'audio')
    const transcriptDir = path.join(process.cwd(), '5(Audio)', 'outputs', 'transcripts')

    // Check audio directory first
    let filePath = path.join(audioDir, filename)
    if (!fs.existsSync(filePath)) {
      // Check transcript directory
      filePath = path.join(transcriptDir, filename)
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
    }

    const fileBuffer = fs.readFileSync(filePath)

    // Set appropriate headers based on file type
    const headers = new Headers()
    if (filename.endsWith('.wav')) {
      headers.set('Content-Type', 'audio/wav')
    } else if (filename.endsWith('.mp3')) {
      headers.set('Content-Type', 'audio/mpeg')
    } else if (filename.endsWith('.txt')) {
      headers.set('Content-Type', 'text/plain')
    }
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}