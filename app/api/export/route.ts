import { type NextRequest, NextResponse } from "next/server"

interface ExportJob {
  id: string
  projectId: string
  projectName: string
  languages: string[]
  format: string
  quality: string
  status: "queued" | "processing" | "completed" | "failed" | "paused"
  progress: number
  startTime: string
  estimatedCompletion?: string
  outputFiles: OutputFile[]
  processingSteps: ProcessingStep[]
}

interface OutputFile {
  id: string
  language: string
  format: string
  size: string
  url: string
  duration: string
}

interface ProcessingStep {
  id: string
  name: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  duration?: string
}

// Mock database
const exportJobs: ExportJob[] = [
  {
    id: "job-1",
    projectId: "1",
    projectName: "Digital India Initiative Update",
    languages: ["Hindi", "English", "Bengali", "Tamil"],
    format: "MP4",
    quality: "1080p",
    status: "processing",
    progress: 65,
    startTime: "2024-01-15T14:30:00Z",
    estimatedCompletion: "2024-01-15T15:45:00Z",
    outputFiles: [],
    processingSteps: [
      { id: "step-1", name: "Text Analysis", status: "completed", progress: 100, duration: "2m 15s" },
      { id: "step-2", name: "Translation", status: "completed", progress: 100, duration: "5m 30s" },
      { id: "step-3", name: "Voice Synthesis", status: "processing", progress: 75 },
      { id: "step-4", name: "Scene Rendering", status: "pending", progress: 0 },
      { id: "step-5", name: "Video Compilation", status: "pending", progress: 0 },
    ],
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const projectId = searchParams.get("projectId")

    let filteredJobs = exportJobs

    if (status) {
      filteredJobs = filteredJobs.filter((job) => job.status === status)
    }

    if (projectId) {
      filteredJobs = filteredJobs.filter((job) => job.projectId === projectId)
    }

    return NextResponse.json({
      success: true,
      data: filteredJobs,
      total: filteredJobs.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch export jobs",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, projectName, languages, format, quality, includeSubtitles, includeThumbnails } = body

    if (!projectId || !projectName || !languages || languages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    const newJob: ExportJob = {
      id: `job-${Date.now()}`,
      projectId,
      projectName,
      languages,
      format: format || "MP4",
      quality: quality || "1080p",
      status: "queued",
      progress: 0,
      startTime: new Date().toISOString(),
      outputFiles: [],
      processingSteps: [
        { id: `step-${Date.now()}-1`, name: "Text Analysis", status: "pending", progress: 0 },
        { id: `step-${Date.now()}-2`, name: "Translation", status: "pending", progress: 0 },
        { id: `step-${Date.now()}-3`, name: "Voice Synthesis", status: "pending", progress: 0 },
        { id: `step-${Date.now()}-4`, name: "Scene Rendering", status: "pending", progress: 0 },
        { id: `step-${Date.now()}-5`, name: "Video Compilation", status: "pending", progress: 0 },
      ],
    }

    exportJobs.push(newJob)

    // Simulate starting the job processing
    setTimeout(() => {
      const jobIndex = exportJobs.findIndex((job) => job.id === newJob.id)
      if (jobIndex !== -1) {
        exportJobs[jobIndex].status = "processing"
      }
    }, 1000)

    return NextResponse.json({
      success: true,
      data: newJob,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create export job",
      },
      { status: 500 },
    )
  }
}
