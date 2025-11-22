"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SecurityUtils } from "@/lib/security"

export async function signInWithEmail(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  // Sanitize inputs
  const sanitizedEmail = SecurityUtils.sanitizeInput(email.toString())
  const sanitizedPassword = SecurityUtils.sanitizeInput(password.toString())

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password: sanitizedPassword,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true, user: data.user }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signUpWithEmail(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const name = formData.get("name")
  const role = formData.get("role")
  const department = formData.get("department")

  if (!email || !password || !name) {
    return { error: "Email, password, and name are required" }
  }

  // Sanitize inputs
  const sanitizedEmail = SecurityUtils.sanitizeInput(email.toString())
  const sanitizedPassword = SecurityUtils.sanitizeInput(password.toString())
  const sanitizedName = SecurityUtils.sanitizeInput(name.toString())
  const sanitizedRole = role ? SecurityUtils.sanitizeInput(role.toString()) : "content-creator"
  const sanitizedDepartment = department ? SecurityUtils.sanitizeInput(department.toString()) : ""

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { data, error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password: sanitizedPassword,
      options: {
        data: {
          name: sanitizedName,
          role: sanitizedRole,
          department: sanitizedDepartment,
        },
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}`,
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Check your email to confirm your account.", user: data.user }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signInWithGoogle() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  await supabase.auth.signOut()
  redirect("/")
}