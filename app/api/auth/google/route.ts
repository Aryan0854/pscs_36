import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { credential } = body

    // In production, verify Google JWT token
    // For now, mock the Google authentication
    const mockGoogleUser = {
      id: `google_${Date.now()}`,
      name: "Google User",
      email: "user@gmail.com",
      role: "Content Creator",
      department: "External User",
      avatar: "https://lh3.googleusercontent.com/a/default-user",
    }

    const token = `jwt_google_${mockGoogleUser.id}_${Date.now()}`

    const cookieStore = cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({
      success: true,
      data: { user: mockGoogleUser, token },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Google authentication failed" }, { status: 500 })
  }
}
