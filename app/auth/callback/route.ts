import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Auth callback error:", error)
        return NextResponse.redirect(`${requestUrl.origin}?auth_error=${encodeURIComponent(error.message)}`)
      }

      if (data.user) {
        // Successfully authenticated, redirect to main app
        return NextResponse.redirect(`${requestUrl.origin}?auth_success=true`)
      }
    } catch (error) {
      console.error("Auth callback exception:", error)
      return NextResponse.redirect(`${requestUrl.origin}?auth_error=callback_failed`)
    }
  }

  return NextResponse.redirect(requestUrl.origin)
}
