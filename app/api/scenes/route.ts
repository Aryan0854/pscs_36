import { type NextRequest, NextResponse } from "next/server"

interface Scene {
  id: string
  projectId: string
  title: string
  description: string
  template: string
  duration: number
  language: string
  status: "draft" | "processing" | "ready"
  assets: SceneAsset[]
  settings: SceneSettings
  createdAt: string
  updatedAt: string
}

interface SceneAsset {
  id: string
  type: "image" | "video" | "audio" | "text"
  name: string
  url: string
  duration?: number
}

interface SceneSettings {
  backgroundColor: string
  textColor: string
  fontSize: number
  animation: string
  transition: string
}

// Mock database
const scenes: Scene[] = [
  {
    id: "scene-1",
    projectId: "1",
    title: "Introduction",
    description: "Opening scene with government logo and title",
    template: "government-intro",
    duration: 30,
    language: "Hindi",
    status: "ready",
    assets: [
      { id: "asset-1", type: "image", name: "Government Logo", url: "/assets/logo.png" },
      { id: "asset-2", type: "text", name: "Title Text", url: "" },
    ],
    settings: {
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      fontSize: 24,
      animation: "fade-in",
      transition: "slide",
    },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    let filteredScenes = scenes

    if (projectId) {
      filteredScenes = scenes.filter((scene) => scene.projectId === projectId)
    }

    return NextResponse.json({
      success: true,
      data: filteredScenes,
      total: filteredScenes.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch scenes",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, title, description, template, duration, language } = body

    if (!projectId || !title || !template) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      projectId,
      title,
      description: description || "",
      template,
      duration: duration || 30,
      language: language || "Hindi",
      status: "draft",
      assets: [],
      settings: {
        backgroundColor: "#ffffff",
        textColor: "#1f2937",
        fontSize: 24,
        animation: "fade-in",
        transition: "slide",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    scenes.push(newScene)

    return NextResponse.json({
      success: true,
      data: newScene,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create scene",
      },
      { status: 500 },
    )
  }
}
