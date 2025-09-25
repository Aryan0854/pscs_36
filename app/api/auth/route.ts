import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

interface User {
  id: string
  name: string
  email: string
  role: string
  department: string
  avatar?: string
}

interface AuthRequest {
  email: string
  password: string
  name?: string
  role?: string
  department?: string
}

// Mock user database
const users: User[] = [
  {
    id: "1",
    name: "Government Official",
    email: "admin@pib.gov.in",
    role: "Administrator",
    department: "Press Information Bureau",
  },
]

export async function POST(request: NextRequest) {
  try {
    const body: AuthRequest = await request.json()
    const { email, password, name, role, department } = body

    // Login
    if (!name) {
      const user = users.find((u) => u.email === email)
      if (!user) {
        return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
      }

      // Generate JWT token (in production, use proper JWT library)
      const token = `jwt_${user.id}_${Date.now()}`

      // Set secure cookie
      const cookieStore = cookies()
      cookieStore.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return NextResponse.json({
        success: true,
        data: { user, token },
      })
    }

    // Signup
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: name!,
      email,
      role: role || "Content Creator",
      department: department || "Government Department",
    }

    users.push(newUser)

    const token = `jwt_${newUser.id}_${Date.now()}`

    const cookieStore = cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({
      success: true,
      data: { user: newUser, token },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = cookies()
    cookieStore.delete("auth_token")

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 })
  }
}
