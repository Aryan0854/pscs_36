import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch projects",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: projects,
      total: projects.length,
    })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects",
      },
      { status: 500 },
    )
  }
}