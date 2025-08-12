import { type NextRequest, NextResponse } from "next/server"

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
}

// Mock settings database
const userSettings: UserSettings[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    const settings = userSettings.find((s) => s.userId === userId) || {
      userId,
      theme: "light",
      defaultLanguage: "english",
      enabledLanguages: ["english", "hindi"],
      notifications: true,
      autoSave: true,
      exportQuality: "high",
      exportFormat: "mp4",
      parallelProcessing: true,
      autoDownload: true,
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...settingsData } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    const existingIndex = userSettings.findIndex((s) => s.userId === userId)
    const updatedSettings = { userId, ...settingsData }

    if (existingIndex >= 0) {
      userSettings[existingIndex] = updatedSettings
    } else {
      userSettings.push(updatedSettings)
    }

    return NextResponse.json({
      success: true,
      data: updatedSettings,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 })
  }
}
