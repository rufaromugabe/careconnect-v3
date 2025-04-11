import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Add this helper function at the top of the file, outside the middleware function
function isSuperAdminFromMetadata(user) {
  return user?.user_metadata?.role === "super-admin"
}

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

export async function middleware(req: NextRequest) {
  // Create a response object
  const res = NextResponse.next()

  // Debug cookies
  const allCookies = req.cookies.getAll()
  console.log("Middleware - All cookies:", allCookies.map((c) => `${c.name}=${c.value}`).join("; "))

  const path = req.nextUrl.pathname
  console.log("Middleware - Path:", path)

  // Special case for the /dashboard path - this is our redirect target from login
  if (path === "/dashboard") {
    // Create the Supabase middleware client
    const supabase = createMiddlewareClient({ req, res })

    // Get the session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if there's a new login by comparing user IDs
    const sessionCookie = req.cookies.get("sb-session-id")?.value
    const userIdCookie = req.cookies.get("sb-user-id")?.value

    // If we have a session but the user ID in the cookie doesn't match the session user ID,
    // clear the role cookie to force re-fetching the role
    if (session && userIdCookie && userIdCookie !== session.user.id) {
      console.log("Middleware - User ID mismatch, clearing role cookie")
      console.log("Middleware - Cookie user ID:", userIdCookie)
      console.log("Middleware - Session user ID:", session.user.id)

      // Clear the role cookie
      res.cookies.set("user_role", "", {
        path: "/",
        maxAge: 0,
        httpOnly: false,
        sameSite: "lax",
      })

      // Update the user ID cookie
      res.cookies.set("sb-user-id", session.user.id, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: false,
        sameSite: "lax",
      })
    }

    // If we have a session but no user ID cookie, set it
    if (session && !userIdCookie) {
      console.log("Middleware - Setting user ID cookie")
      res.cookies.set("sb-user-id", session.user.id, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: false,
        sameSite: "lax",
      })
    }

    if (!session) {
      console.log("Middleware - No session, redirecting to login")
      return NextResponse.redirect(new URL("/", req.url))
    }

    console.log("Middleware - Session found for user:", session.user.id)

    // Check for the role cookie first
    const roleCookie = req.cookies.get("user_role")?.value

    if (roleCookie) {
      console.log("Middleware - Found role in cookie, redirecting to:", roleCookie)
      return NextResponse.redirect(new URL(`/${roleCookie}/dashboard`, req.url))
    }

    // First check if the role is in user metadata (avoids RLS issues)
    if (session.user.user_metadata?.role) {
      const metadataRole = session.user.user_metadata.role
      console.log("Middleware - Found role in user metadata:", metadataRole)

      // Set the role cookie
      res.cookies.set("user_role", metadataRole, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: false, // Allow JavaScript access
        sameSite: "lax",
      })

      // Redirect to the appropriate dashboard
      return NextResponse.redirect(new URL(`/${metadataRole}/dashboard`, req.url))
    }

    // Try to get the role from the database (subject to RLS)
    console.log("Middleware - Attempting to fetch role from database (subject to RLS)")
    try {
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single()

      if (error) {
        console.error("Middleware - Error fetching user role:", error.message)

        // Let the client-side handle it
        console.log("Middleware - Letting client-side handle role fetching")
        return NextResponse.next()
      }

      if (!roleData?.role) {
        console.log("Middleware - User has no role assigned")
        return NextResponse.redirect(new URL("/auth/select-role", req.url))
      }

      console.log("Middleware - Successfully fetched role:", roleData.role)

      // Set the role cookie for future use
      res.cookies.set("user_role", roleData.role, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: false, // Allow JavaScript access
        sameSite: "lax",
      })

      // Redirect to the appropriate dashboard based on the user's role
      console.log("Middleware - Redirecting to dashboard for role:", roleData.role)
      return NextResponse.redirect(new URL(`/${roleData.role}/dashboard`, req.url))
    } catch (error) {
      console.error("Middleware - Unexpected error in role fetch:", error)
      // Let the client-side handle it
      return NextResponse.next()
    }
  }

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route))

  // Skip middleware for public routes, static files, and images
  if (isPublicRoute || path.startsWith("/_next/") || path.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)) {
    return res
  }

  // Create the Supabase middleware client
  const supabase = createMiddlewareClient({ req, res })

  // Get the session - this refreshes the session if needed
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Debug session information
  console.log("Middleware - Session exists:", !!session)
  console.log("Middleware - Session user ID:", session?.user?.id)

  // Check for the role cookie
  const roleCookie = req.cookies.get("user_role")?.value
  const sessionActiveCookie = req.cookies.get("supabase-auth-session-active")?.value

  console.log("Middleware - Role cookie:", roleCookie)
  console.log("Middleware - Session active cookie:", sessionActiveCookie)

  // If there's no session, redirect to login
  if (!session) {
    console.log("Middleware - No session, redirecting to login")
    return NextResponse.redirect(new URL("/", req.url))
  }

  // If there's a session but no role cookie, we need to verify the role
  if (!roleCookie) {
    // First check if the role is in user metadata (avoids RLS issues)
    if (session.user.user_metadata?.role) {
      const metadataRole = session.user.user_metadata.role
      console.log("Middleware - Found role in user metadata:", metadataRole)

      // Set the role cookie
      res.cookies.set("user_role", metadataRole, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: false, // Allow JavaScript access
        sameSite: "lax",
      })

      // For super-admin, allow access to all roles
      if (metadataRole === "super-admin") {
        console.log("Middleware - User is super admin from metadata")
        return res
      }

      // Check access for the current path
      const basePath = `/${path.split("/")[1]}/`
      const allowedPaths = roleRouteMap[metadataRole] || []
      const hasAccess = allowedPaths.some((allowedPath) => basePath.startsWith(allowedPath))

      if (!hasAccess) {
        console.log(`Middleware - User with role ${metadataRole} attempted to access unauthorized route: ${path}`)
        return NextResponse.redirect(new URL(`/${metadataRole}/dashboard`, req.url))
      }

      return res
    }

    try {
      // Fetch the user's role from the database (subject to RLS)
      console.log("Middleware - Attempting to fetch role from database (subject to RLS)")
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single()

      if (error) {
        console.error("Middleware - Error fetching user role:", error.message)
        console.log("Middleware - Error code:", error.code)

        // Check if this is an RLS policy error
        if (error.code === "42501" || error.message.includes("permission denied")) {
          console.log("Middleware - RLS policy prevented access")
        }

        // Let the client-side handle it - redirect to dashboard which will handle role fetching
        console.log("Middleware - Redirecting to dashboard to handle role fetching")
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }

      if (roleData?.role) {
        console.log("Middleware - Successfully fetched role:", roleData.role)

        // Set the role cookie for future use
        res.cookies.set("user_role", roleData.role, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          httpOnly: false, // Allow JavaScript access
          sameSite: "lax",
        })

        // If the user is trying to access a route that doesn't match their role,
        // redirect them to their dashboard
        const basePath = `/${path.split("/")[1]}/`
        const allowedPaths = roleRouteMap[roleData.role] || []
        const hasAccess = allowedPaths.some((allowedPath) => basePath.startsWith(allowedPath))

        if (!hasAccess) {
          console.log(`Middleware - User with role ${roleData.role} attempted to access unauthorized route: ${path}`)
          return NextResponse.redirect(new URL(`/${roleData.role}/dashboard`, req.url))
        }
      } else {
        console.log("Middleware - User has no role assigned")
        // If the user has no role, redirect to role selection
        return NextResponse.redirect(new URL("/auth/select-role", req.url))
      }
    } catch (error) {
      console.error("Middleware - Error in role verification:", error)
      // Redirect to dashboard which will handle role fetching
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  } else {
    // If we have a role cookie, check if the user has access to the requested route
    const basePath = `/${path.split("/")[1]}/`
    const allowedPaths = roleRouteMap[roleCookie] || []
    const hasAccess = allowedPaths.some((allowedPath) => basePath.startsWith(allowedPath))

    if (!hasAccess) {
      console.log(`Middleware - User with role ${roleCookie} attempted to access unauthorized route: ${path}`)
      // Redirect to the user's dashboard
      return NextResponse.redirect(new URL(`/${roleCookie}/dashboard`, req.url))
    }
  }

  // Add this check after verifying the user's role

  // Check if the user's profile is completed
  if (session?.user?.user_metadata && session.user.user_metadata.profile_completed !== true) {
    // Skip profile completion check for public routes and profile completion routes
    if (!path.includes("/complete-profile") && !isPublicRoute) {
      console.log("Middleware - User profile not completed, redirecting to profile completion")
      return NextResponse.redirect(new URL(`/${roleCookie}/complete-profile`, req.url))
    }
  }

  // Set the session cookie with a longer expiration
  res.cookies.set("supabase-auth-session-active", "true", {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  })

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
