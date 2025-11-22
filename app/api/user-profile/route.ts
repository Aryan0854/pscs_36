import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    console.warn("[User Profile API] Supabase not configured - returning empty profile")
    return NextResponse.json({ error: "User profile service unavailable" }, { status: 503 })
  }
  
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    console.warn("[User Profile API] Supabase not configured - cannot update profile")
    return NextResponse.json({ error: "User profile service unavailable" }, { status: 503 })
  }
  
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update user profile
    const { data: profile, error: updateError } = await supabase
      .from("user_profiles")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 400 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
