import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    const videoDir = path.join(process.cwd(), 'public', 'generated', 'videos')

    const filePath = path.join(videoDir, filename)
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Video file not found' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)
    
    // Get the range header for partial content requests
    const range = request.headers.get('range')
    
    if (range) {
      // Handle partial content requests for video streaming
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileBuffer.byteLength - 1
      const chunksize = (end - start) + 1
      const fileChunk = fileBuffer.subarray(start, end + 1)
      
      const headers = new Headers()
      headers.set('Content-Type', 'video/mp4')
      headers.set('Content-Length', chunksize.toString())
      headers.set('Content-Range', `bytes ${start}-${end}/${fileBuffer.byteLength}`)
      headers.set('Accept-Ranges', 'bytes')
      headers.set('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
      
      return new NextResponse(fileChunk, {
        status: 206, // Partial Content
        headers
      })
    } else {
      // Serve full video
      const headers = new Headers()
      headers.set('Content-Type', 'video/mp4')
      headers.set('Content-Length', fileBuffer.byteLength.toString())
      headers.set('Accept-Ranges', 'bytes')
      headers.set('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      })
    }

  } catch (error) {
    console.error('Video download error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}