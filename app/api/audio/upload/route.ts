import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("[Audio Upload API] Starting audio file upload")

    // Create Supabase client if configured
    let supabase = null;
    let user = null;
    if (isSupabaseConfigured) {
      supabase = await createServerClient(request);
      // Get user if available, but don't fail if not authenticated (for now)
      const { data: { user: userData } } = await supabase.auth.getUser();
      user = userData;
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const audioType = formData.get("audioType") as string

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Validate audio file type
    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/aac",
      "audio/x-m4a"
    ]

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a']

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
      return NextResponse.json({
        success: false,
        error: "Invalid file type. Only audio files (MP3, WAV, OGG, AAC, M4A) are allowed."
      }, { status: 400 })
    }

    // Check file size (max 50MB for audio)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: "File size too large. Maximum size is 50MB."
      }, { status: 400 })
    }

    // Generate unique filename
    const fileId = randomUUID()
    const extension = fileExtension || 'mp3'
    const filename = `${fileId}.${extension}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'audio')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, continue
    }

    // Save file to disk
    const filePath = join(uploadsDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create database record if Supabase is configured
    let audioRecord = null;
    if (isSupabaseConfigured && supabase) {
      const audioData = {
        id: fileId,
        filename: file.name,
        original_filename: file.name,
        file_path: `/uploads/audio/${filename}`,
        audio_type: audioType,
        file_size: file.size,
        mime_type: file.type,
        duration: null, // Could be calculated later
        user_id: user?.id || null,
        created_at: new Date().toISOString(),
      }

      const { data, error: dbError } = await supabase
        .from("audio_files")
        .insert(audioData)
        .select()
        .single()

      if (dbError) {
        console.error("[Audio Upload API] Database error:", dbError)
        // Try to clean up the file
        try {
          const fs = require('fs')
          fs.unlinkSync(filePath)
        } catch (cleanupError) {
          console.error("[Audio Upload API] Cleanup failed:", cleanupError)
        }
        return NextResponse.json({
          success: false,
          error: "Failed to save audio record to database"
        }, { status: 500 })
      }
      
      audioRecord = data;
    }

    console.log("[Audio Upload API] Audio uploaded successfully")

    // Return response with or without database record
    const responseData: any = {
      success: true,
      data: {
        id: fileId,
        filename: file.name,
        audioUrl: `/uploads/audio/${filename}`,
        audioType: audioType,
        fileSize: file.size,
      },
      message: "Audio file uploaded successfully"
    };
    
    // Add database ID if available
    if (audioRecord) {
      responseData.data.id = audioRecord.id;
      responseData.data.filename = audioRecord.filename;
      responseData.data.audioUrl = audioRecord.file_path;
      responseData.data.fileSize = audioRecord.file_size;
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error("[Audio Upload API] Upload error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to upload audio file"
    }, { status: 500 })
  }
}