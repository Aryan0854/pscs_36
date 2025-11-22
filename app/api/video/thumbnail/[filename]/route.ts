import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    const thumbnailDir = path.join(process.cwd(), 'public', 'generated', 'thumbnails')

    const filePath = path.join(thumbnailDir, filename)
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Thumbnail file not found' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)

    // Set appropriate headers for image
    const headers = new Headers()
    headers.set('Content-Type', 'image/jpeg')
    headers.set('Content-Length', fileBuffer.byteLength.toString())
    headers.set('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
    headers.set('Accept-Ranges', 'bytes')

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Thumbnail download error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}