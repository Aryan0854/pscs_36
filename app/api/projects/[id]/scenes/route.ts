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

    const { data: scenes, error } = await supabase
      .from("project_scenes")
      .select("*")
      .eq("project_id", params.id)
      .eq("created_by", user.id)
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: "Scenes not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: scenes.scenes_data,
    })
  } catch (error) {
    console.error("[v0] Scenes API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch scenes" }, { status: 500 })
  }
}
