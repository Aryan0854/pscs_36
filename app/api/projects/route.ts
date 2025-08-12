import { type NextRequest, NextResponse } from "next/server"

interface Project {
  id: string
  title: string
  description: string
  status: "draft" | "processing" | "ready"
  languages: string[]
  scenes: string[]
  createdAt: string
  updatedAt: string
  userId: string
}

// Mock database - in production, this would be a real database
const projects: Project[] = [
  {
    id: "1",
    title: "Digital India Initiative Update",
    description: "Latest updates on Digital India progress",
    status: "processing",
    languages: ["Hindi", "English", "Bengali", "Tamil"],
    scenes: ["scene-1", "scene-2", "scene-3"],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
    userId: "user-1",
  },
  {
    id: "2",
    title: "Healthcare Policy Announcement",
    description: "New healthcare policy details",
    status: "ready",
    languages: ["Hindi", "English", "Bengali", "Tamil", "Telugu", "Marathi"],
    scenes: ["scene-4", "scene-5"],
    createdAt: "2024-01-14T09:00:00Z",
    updatedAt: "2024-01-14T16:00:00Z",
    userId: "user-1",
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId") || "user-1"

    let filteredProjects = projects.filter((project) => project.userId === userId)

    if (status) {
      filteredProjects = filteredProjects.filter((project) => project.status === status)
    }

    return NextResponse.json({
      success: true,
      data: filteredProjects,
      total: filteredProjects.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, languages } = body

    if (!title || !description || !languages || languages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    const newProject: Project = {
      id: `project-${Date.now()}`,
      title,
      description,
      status: "draft",
      languages,
      scenes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: "user-1", // In production, get from authentication
    }

    projects.push(newProject)

    return NextResponse.json({
      success: true,
      data: newProject,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create project",
      },
      { status: 500 },
    )
  }
}
