import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {},
          remove() {},
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const { data: timeline, error } = await supabase
      .from("project_timeline")
      .select("*")
      .eq("project_id", params.id)
      .eq("created_by", user.id)
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: "Timeline not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: timeline.timeline_data,
    })
  } catch (error) {
    console.error("[v0] Timeline API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch timeline" }, { status: 500 })
  }
}
