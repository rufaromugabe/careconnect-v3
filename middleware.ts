import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define role-based route restrictions
const roleRouteMap = {
  doctor: ["/doctor/"],
  nurse: ["/nurse/"],
  patient: ["/patient/"],
  pharmacist: ["/pharmacist/"],
  "super-admin": ["/super-admin/", "/doctor/", "/nurse/", "/patient/", "/pharmacist/"], // Super admin can access all routes
}

// Public routes that don't require authentication
const publicRoutes = ["/", "/register", "/auth/callback", "/api/auth/", "/api/admin/", "/unauthorized"]

// Helper function to get cookie value
function getCookie(request: NextRequest, name: string): string | undefined {
  return request.cookies.get(name)?.value
}

// Helper function to check if a path is public
function isPublicPath(path: string): boolean {
  return (
    publicRoutes.some((route) => path.startsWith(route)) ||
    path.startsWith("/_next/") ||
    path.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/) !== null
  )
}

// Helper function to check if a user has access to a path based on role
function hasAccessToPath(role: string, path: string): boolean {
  const basePath = `/${path.split("/")[1]}/`
  const allowedPaths = roleRouteMap[role] || []
  return allowedPaths.some((allowedPath) => basePath.startsWith(allowedPath))
}

export async function middleware(req: NextRequest) {
  // Create a response object
  const res = NextResponse.next()
  const path = req.nextUrl.pathname

  // Skip middleware for public routes, static files, and images
  if (isPublicPath(path)) {
    return res
  }

  // Create the Supabase middleware client
  const supabase = createMiddlewareClient({ req, res })

  // Special case for the /dashboard path - this is our redirect target from login
  if (path === "/dashboard") {
    // Get the session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Check for the role cookie first (fastest path)
    const roleCookie = getCookie(req, "user_role")

    if (roleCookie) {
      return NextResponse.redirect(new URL(`/${roleCookie}/dashboard`, req.url))
    }

    // Check user metadata (second fastest)
    if (session.user.user_metadata?.role) {
      const role = session.user.user_metadata.role

      // Set the role cookie
      res.cookies.set("user_role", role, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: false,
        sameSite: "lax",
      })

      return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url))
    }

    // Try to get the role from the database (slowest but most reliable)
    try {
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single()

      if (error) {
        // Let the client-side handle it
        return NextResponse.next()
      }

      if (!roleData?.role) {
        return NextResponse.redirect(new URL("/auth/select-role", req.url))
      }

      // Set the role cookie for future use
      res.cookies.set("user_role", roleData.role, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: false,
        sameSite: "lax",
      })

      return NextResponse.redirect(new URL(`/${roleData.role}/dashboard`, req.url))
    } catch (error) {
      // Let the client-side handle it
      return NextResponse.next()
    }
  }

  // For all other protected routes

  // Get the session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If there's no session, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Check for the role cookie
  const roleCookie = getCookie(req, "user_role")

  // If there's a role cookie, check access
  if (roleCookie) {
    // Check if the user has access to the requested route
    if (!hasAccessToPath(roleCookie, path)) {
      return NextResponse.redirect(new URL(`/${roleCookie}/dashboard`, req.url))
    }

    // Check if profile is completed
    if (
      session?.user?.user_metadata &&
      session.user.user_metadata.profile_completed !== true &&
      !path.includes("/complete-profile")
    ) {
      return NextResponse.redirect(new URL(`/${roleCookie}/complete-profile`, req.url))
    }

    // User has access, continue
    return res
  }

  // If no role cookie, check user metadata
  if (session.user.user_metadata?.role) {
    const role = session.user.user_metadata.role

    // Set the role cookie
    res.cookies.set("user_role", role, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: false,
      sameSite: "lax",
    })

    // Check if the user has access to the requested route
    if (!hasAccessToPath(role, path)) {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url))
    }

    // Check if profile is completed
    if (
      session?.user?.user_metadata &&
      session.user.user_metadata.profile_completed !== true &&
      !path.includes("/complete-profile")
    ) {
      return NextResponse.redirect(new URL(`/${role}/complete-profile`, req.url))
    }

    // User has access, continue
    return res
  }

  // If no role information is available, redirect to dashboard to handle role fetching
  return NextResponse.redirect(new URL("/dashboard", req.url))
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
