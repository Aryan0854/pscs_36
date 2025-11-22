import { type NextRequest, NextResponse } from "next/server"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"

interface UserSettings {
  userId: string
  theme: "light" | "dark" | "system"
  defaultLanguage: string
  enabledLanguages: string[]
  notifications: boolean
  autoSave: boolean
  exportQuality: "high" | "medium" | "low"
  exportFormat: "mp4" | "mov" | "avi"
  parallelProcessing: boolean
  autoDownload: boolean
  audioLanguage?: string // Add audio language setting
}

export async function GET(request: NextRequest) {
  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    console.warn("[Settings API] Supabase not configured - returning default settings")
    const defaultSettings = {
      userId: null,
      theme: "dark",
      defaultLanguage: "en",
      enabledLanguages: ["en", "hi"],
      notifications: true,
      autoSave: true,
      exportQuality: "high",
      exportFormat: "mp4",
      parallelProcessing: true,
      autoDownload: true,
      audioLanguage: "same-as-ui",
    }
    
    return NextResponse.json({
      success: true,
      data: defaultSettings,
    })
  }
  
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log("[Settings API] Auth user:", user, "error:", authError)

    let settings: any = null

    if (user) {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("preferences")
        .eq("id", user.id)
        .single()

      console.log("[Settings API] Profile query result:", { data: profile, error })

      if (error && error.code !== "PGRST116") {
        console.error("[Settings API] Database error:", error)
        throw error
      }

      const defaultSettings = {
        userId: user.email,
        theme: "dark",
        defaultLanguage: "en",
        enabledLanguages: ["en", "hi"],
        notifications: true,
        autoSave: true,
        exportQuality: "high",
        exportFormat: "mp4",
        parallelProcessing: true,
        autoDownload: true,
        audioLanguage: "same-as-ui", // Add default audio language setting
      }

      settings = profile?.preferences ? { ...defaultSettings, ...profile.preferences } : defaultSettings
    } else {
      // Return defaults for unauthenticated users
      settings = {
        userId: null,
        theme: "dark",
        defaultLanguage: "en",
        enabledLanguages: ["en", "hi"],
        notifications: true,
        autoSave: true,
        exportQuality: "high",
        exportFormat: "mp4",
        parallelProcessing: true,
        autoDownload: true,
      }
    }

    console.log("[Settings API] Returning settings:", settings)

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error("[Settings API] GET error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    console.warn("[Settings API] Supabase not configured - cannot save settings")
    return NextResponse.json({ success: false, error: "Settings service unavailable" }, { status: 503 })
  }
  
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log("[Settings API] Auth user:", user, "error:", authError)

    if (authError || !user) {
      console.log("[Settings API] No authenticated user - settings not saved")
      return NextResponse.json({ success: false, error: "Authentication required to save settings" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, ...settingsData } = body
    console.log("[Settings API] PUT request data:", settingsData)

    const upsertData = {
      id: user.id,
      email: user.email,
      preferences: settingsData,
      updated_at: new Date().toISOString(),
    }
    console.log("[Settings API] Upserting data:", upsertData)

    const { data, error } = await supabase.from("user_profiles").upsert(upsertData, {
      onConflict: "id",
    }).select()

    console.log("[Settings API] Upsert result:", { data, error })

    if (error) {
      console.error("[Settings API] Database error:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: { userId: user.email, ...settingsData },
    })
  } catch (error) {
    console.error("[Settings API] PUT error:", error)
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 })
  }
}
