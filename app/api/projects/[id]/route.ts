import { type NextRequest, NextResponse } from "next/server"

// Mock database - same as in route.ts
const projects = [
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = projects.find((p) => p.id === params.id)

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: project,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch project",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const projectIndex = projects.findIndex((p) => p.id === params.id)

    if (projectIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 },
      )
    }

    projects[projectIndex] = {
      ...projects[projectIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: projects[projectIndex],
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update project",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectIndex = projects.findIndex((p) => p.id === params.id)

    if (projectIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 },
      )
    }

    projects.splice(projectIndex, 1)

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete project",
      },
      { status: 500 },
    )
  }
}
