import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define role-based route restrictions
type UserRole = "doctor" | "nurse" | "patient" | "pharmacist" | "super-admin";

const roleRouteMap: Record<UserRole, string[]> = {
  doctor: ["/doctor/"],
  nurse: ["/nurse/"],
  patient: ["/patient/"],
  pharmacist: ["/pharmacist/"],
  "super-admin": ["/super-admin/", "/doctor/", "/nurse/", "/patient/", "/pharmacist/"], // Super admin can access all routes
}

// Public routes that don't require authentication
const publicRoutes = ["/", "/register", "/auth/callback", "/api/auth/", "/api/admin/", "/unauthorized"]

// Helper function to check if a path is public
function isPublicPath(path: string): boolean {
  return (
    publicRoutes.some((route) => path.startsWith(route)) ||
    path.startsWith("/_next/") ||
    path.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/) !== null
  )

 
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

    // Check user metadata (fastest way)
    if (session.user.user_metadata?.role) {
      const role = session.user.user_metadata.role
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

  const role = session.user.user_metadata?.role
  const is_verified = session.user.user_metadata?.is_verified
  const is_active = session.user.user_metadata?.is_active

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
  // Check if the user is verified
  if (
    session?.user?.user_metadata &&
    session.user.user_metadata.is_verified !== true &&
    !path.includes("/verify")
  ) {
    return NextResponse.redirect(new URL(`/${role}/verify`, req.url))
  }
  if (session?.user?.user_metadata && session.user.user_metadata.is_active !== true && !path.includes("/in-active")) {
    return NextResponse.redirect(new URL(`/${role}/in-active`, req.url))

  }

  // User has access, continue
  return res
}

// Helper function to check if a user has access to a path based on role
function hasAccessToPath(role: string, path: string): boolean {
  if (!role) return false;
  
  const basePath = `/${path.split("/")[1]}/`;
  const allowedPaths = (role in roleRouteMap ? roleRouteMap[role as UserRole] : []);
  return allowedPaths.some((allowedPath: string) => basePath.startsWith(allowedPath));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}


