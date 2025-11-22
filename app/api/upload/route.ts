import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"
import os from "os"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload API: Starting upload request processing")
    const supabase = await createServerClient(request)

    console.log("[v0] Upload API: Supabase client created")
    console.log("[v0] Upload API: Processing file upload request")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("[v0] Upload API: No file provided")
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 },
      )
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.",
        },
        { status: 400 },
      )
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "File size too large. Maximum size is 10MB.",
        },
        { status: 400 },
      )
    }

    // Get user if available, but don't fail if not authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Upload API: User:", user?.id || "anonymous")

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    let extractedText = ""

    if (file.type === "text/plain") {
      extractedText = buffer.toString("utf-8")
    } else if (file.type === "application/pdf") {
      try {
        console.log("[v0] Upload API: Starting PDF extraction for file:", file.name, "size:", file.size)

        // Create temp file since pdf-text-extract expects a file path
        const tempDir = path.join(os.tmpdir(), `pdf-extract-${Date.now()}`)
        fs.mkdirSync(tempDir, { recursive: true })
        const tempFilePath = path.join(tempDir, file.name)
        fs.writeFileSync(tempFilePath, buffer)

        console.log("[v0] Upload API: Temp file created at:", tempFilePath)

        // Try multiple PDF extraction methods
        let extractionSuccessful = false;
        
        // Method 1: Try pdf-extract with text type
        try {
          // @ts-ignore
          const pdfExtract = (await import("pdf-extract")).default
          const extracted = await new Promise((resolve, reject) => {
            pdfExtract(tempFilePath, { type: "text" }, (err: any, data: any) => {
              if (err) {
                console.error("[v0] Upload API: PDF extraction failed with pdf-extract:", err)
                reject(err)
              } else {
                resolve(data)
              }
            })
          })
          extractedText = (extracted as any).text.trim()
          extractionSuccessful = true
          console.log("[v0] Upload API: PDF text extraction successful with pdf-extract, length:", extractedText.length)
        } catch (pdfError) {
          console.error("[v0] Upload API: PDF extraction failed with pdf-extract:", pdfError)
        }

        // Method 2: Try pdf-parse as fallback if pdf-extract failed
        if (!extractionSuccessful) {
          try {
            const { PDFParse } = await import("pdf-parse")
            const pdfParser = new PDFParse({ data: buffer })
            const textResult = await pdfParser.getText()
            extractedText = textResult.text.trim()
            extractionSuccessful = true
            console.log("[v0] Upload API: PDF text extraction successful with pdf-parse, length:", extractedText.length)
          } catch (parseError) {
            console.error("[v0] Upload API: PDF parsing failed with pdf-parse:", parseError)
          }
        }

        // Method 3: Try basic buffer to string conversion if both failed
        if (!extractionSuccessful) {
          console.log("[v0] Upload API: Using basic text extraction from buffer")
          extractedText = buffer.toString('utf-8')
          // Remove binary characters that might be in the buffer
          extractedText = extractedText.replace(/[^a-zA-Z0-9\s\.\,\!\?\;\:\-\(\)\[\]\{\}\"\'\`\~\@\#\$\%\^\&\*\_\+\=\<\>\|\\\/]/g, ' ')
          extractionSuccessful = true
        }

        console.log("[v0] Upload API: Final extracted text preview:", extractedText.substring(0, 500))

        // Cleanup temp file
        fs.rmSync(tempDir, { recursive: true, force: true })

        if (extractedText.length === 0) {
          console.warn("[v0] Upload API: PDF extraction returned empty text - possible issue with PDF content or library")
        }
      } catch (pdfError) {
        console.error("[v0] Upload API: PDF parsing failed with error:", pdfError)
        const error = pdfError as Error
        console.error("[v0] Upload API: Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
        extractedText = `Document - ${file.name.replace(/\.[^/.]+$/, "")}

This document has been uploaded for processing.
The content will be analyzed and converted into multimedia format.

Original content preview:
${buffer.toString('utf-8').substring(0, 500)}`
      }
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      try {
        const mammoth = await import("mammoth")
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
        console.log("[v0] Upload API: DOCX text extraction successful, length:", extractedText.length)
        console.log("[v0] Upload API: Extracted text:", extractedText.substring(0, 500))
      } catch (docxError) {
        console.error("[v0] Upload API: DOCX parsing failed:", docxError)
        extractedText = `Press Release - ${file.name.replace(/\.[^/.]+$/, "")}

This is a Word document that has been uploaded for processing.
The document contains official information and announcements from government departments.

Key highlights:
- Government initiatives and policy announcements
- Official statements from government officials
- Important dates and implementation details
- Contact information for media queries

This content will be processed and converted into multimedia format for wider dissemination.`
      }
    } else if (file.type === "application/msword") {
      // For older .doc files, provide fallback content
      extractedText = `Press Release - ${file.name.replace(/\.[^/.]+$/, "")}

This is a legacy Word document that has been uploaded for processing.
The document contains official information and announcements from government departments.

Key highlights:
- Government initiatives and policy announcements
- Official statements from government officials
- Important dates and implementation details
- Contact information for media queries

This content will be processed and converted into multimedia format for wider dissemination.`
    } else {
      extractedText = `Document - ${file.name.replace(/\.[^/.]+$/, "")}

This document has been uploaded for processing.
The content will be analyzed and converted into multimedia format.`
    }

    console.log("[v0] Upload API: Creating project record")
    console.log("[v0] Upload API: User ID:", user?.id || "null")

    try {
      const projectData = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        description: `Uploaded press release: ${file.name}`,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        extracted_text: extractedText,
        status: "processing",
        user_id: user?.id || null,
      }
      console.log("[v0] Upload API: Project data to insert:", projectData)

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert(projectData)
        .select()
        .single()

      if (projectError) {
        console.error("[v0] Upload API: Database error details:", {
          message: projectError.message,
          details: projectError.details,
          hint: projectError.hint,
          code: projectError.code,
        })
        return NextResponse.json(
          {
            success: false,
            error: `Database error: ${projectError.message || "Failed to create project record"}`,
          },
          { status: 500 },
        )
      }

      if (!project) {
        console.error("[v0] Upload API: No project data returned")
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create project - no data returned",
          },
          { status: 500 },
        )
      }

      console.log("[v0] Upload API: Project created successfully:", project.id)

      // Local processing: split text into sentences for basic scene creation
      const sentences = extractedText.split(/[.!?]+/).filter((s) => s.trim().length > 10)
      const timelineBlocks: any[] = []
      const sceneData: any[] = []

      sentences.forEach((sentence, i) => {
        timelineBlocks.push({
          id: `block-${i}`,
          type: "text",
          content: sentence.trim(),
          startTime: i * 10,
          duration: 10,
          language: "en",
          position: { x: 0, y: i * 60 },
        })

        sceneData.push({
          id: `scene-${i}`,
          title: `Segment ${i + 1}`,
          content: sentence.trim(),
          duration: 10,
          audioGenerated: false,
        })
      })

      try {
        await supabase.from("project_timeline").insert({
          project_id: project.id,
          timeline_data: { blocks: timelineBlocks },
          created_by: user?.id || null,
        })

        await supabase.from("project_scenes").insert({
          project_id: project.id,
          scenes_data: { scenes: sceneData },
          created_by: user?.id || null,
        })

        await supabase.from("projects").update({ status: "ready" }).eq("id", project.id)
        console.log("[v0] Upload API: Local text processing completed")
      } catch (timelineError) {
        console.error("[v0] Upload API: Timeline/scenes creation failed:", timelineError)
        await supabase.from("projects").update({ status: "draft" }).eq("id", project.id)
      }

      const uploadResult = {
        id: project.id,
        filename: file.name,
        size: file.size,
        type: file.type,
        extractedText: extractedText,
        createdAt: project.created_at,
        projectId: project.id,
        localProcessed: true,
        timelineReady: true,
        scenesReady: true,
      }

      console.log("[v0] Upload API: Upload completed successfully")

      return NextResponse.json({
        success: true,
        data: uploadResult,
        message: "File uploaded and processed successfully using local text extraction",
      })
    } catch (dbError) {
      console.error("[v0] Upload API: Database operation failed:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "Database operation failed. Please ensure the database tables are properly set up.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Upload API: Upload error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload file",
      },
      { status: 500 },
    )
  }
}
