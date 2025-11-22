import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch project",
        },
        { status: 500 },
      )
    }

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
    console.error("Error fetching project:", error)
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
    const supabase = await createClient()
    
    const body = await request.json()
    
    // Remove fields that shouldn't be updated directly
    const { id, user_id, created_at, ...updateData } = body
    
    const { data: project, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update project",
        },
        { status: 500 },
      )
    }

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
    console.error("Error updating project:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update project",
      },
      { status: 500 },
    )
  }
}