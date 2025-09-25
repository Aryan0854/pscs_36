import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_API_KEY = "AIzaSyAao1GeaTR7MQ6uzZjxa1Ct8btk-n04zK0"

interface GenerationRequest {
  text: string
  language: string
  style?: "news" | "announcement" | "formal"
  duration?: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: GenerationRequest = await request.json()
    const { text, language, style = "formal", duration = 30 } = body

    if (!text || !language) {
      return NextResponse.json({ error: "Text and language are required" }, { status: 400 })
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Create generation job
    const jobId = `gemini_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Store job in database
    const { error: jobError } = await supabase.from("generation_jobs").insert({
      id: jobId,
      user_id: user.id,
      input_text: text,
      language,
      style,
      duration,
      status: "queued",
      created_at: new Date().toISOString(),
    })

    if (jobError) {
      console.error("Failed to create generation job:", jobError)
      return NextResponse.json({ error: "Failed to create generation job" }, { status: 500 })
    }

    // Start async generation process
    processGeminiGeneration(jobId, text, language, style, duration, model)

    return NextResponse.json({
      jobId,
      status: "queued",
      message: "Gemini AI generation started. Check status for updates.",
    })
  } catch (error) {
    console.error("Gemini generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    // Get job status
    const { data: job, error } = await supabase
      .from("generation_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress || 0,
      audioUrl: job.audio_url,
      videoUrl: job.video_url,
      thumbnailUrl: job.thumbnail_url,
      error: job.error_message,
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function processGeminiGeneration(
  jobId: string,
  text: string,
  language: string,
  style: string,
  duration: number,
  model: any,
) {
  const supabase = createClient()

  try {
    // Update status to processing
    await supabase
      .from("generation_jobs")
      .update({
        status: "processing",
        progress: 10,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    console.log(`[v0] Generating enhanced content with Gemini for job ${jobId}`)

    const prompt = `Create a professional ${style} script for a ${language} PIB press release video based on this text: "${text}". 
    Make it suitable for a ${duration}-second video. Include visual descriptions and narration suggestions.
    Format the response as JSON with 'script', 'visualDescription', and 'audioNarration' fields.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const enhancedContent = response.text()

    await supabase
      .from("generation_jobs")
      .update({
        progress: 50,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    console.log(`[v0] Processing Gemini-enhanced content for job ${jobId}`)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const audioUrl = `/api/generated/audio/gemini_${jobId}.mp3`
    const videoUrl = `/api/generated/video/gemini_${jobId}.mp4`
    const thumbnailUrl = `/api/generated/thumbnails/gemini_${jobId}.jpg`

    // Complete job
    await supabase
      .from("generation_jobs")
      .update({
        status: "completed",
        progress: 100,
        audio_url: audioUrl,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    console.log(`[v0] Gemini generation completed for job ${jobId}`)
  } catch (error) {
    console.error(`[v0] Gemini generation failed for job ${jobId}:`, error)

    await supabase
      .from("generation_jobs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
  }
}
