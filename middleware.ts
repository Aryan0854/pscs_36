import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SecurityUtils } from "@/lib/security"

// Check if Supabase is configured
const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Apply rate limiting
  const isAllowed = await SecurityUtils.rateLimit(req, 100, 60000) // 100 requests per minute
  if (!isAllowed) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  // Apply additional security headers
  SecurityUtils.applySecurityHeaders(res);

  // Only create Supabase client if configured
  if (isSupabaseConfigured) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value)
              res.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Handle auth callback
    if (req.nextUrl.pathname === "/auth/callback") {
      const code = req.nextUrl.searchParams.get("code")
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
        return NextResponse.redirect(new URL("/", req.url))
      }
    }
  }

  // Protect API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    // Add CORS headers for API routes
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204 })
    }
    
    // Validate CSRF token for state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const csrfToken = req.headers.get('X-CSRF-Token')
      // In a real implementation, you would validate the token against a stored value
      // For now, we'll just check that it exists
      if (!csrfToken) {
        // In development mode, allow requests without CSRF token
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Middleware] Warning: Missing CSRF token in development mode - allowing request')
        } else {
          return new NextResponse('Missing CSRF token', { status: 403 })
        }
      }
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}