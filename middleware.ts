import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  })
  const isAuthenticated = !!token

  // Define protected routes
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/upload") ||
    request.nextUrl.pathname.startsWith("/chat") ||
    request.nextUrl.pathname.startsWith("/profile")

  // Define admin routes
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")

  // Define auth routes
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/auth/login") || request.nextUrl.pathname.startsWith("/auth/register")

  // Add debug information to response headers in development
  const response = NextResponse.next()
  if (process.env.NODE_ENV === "development") {
    response.headers.set("x-middleware-cache", "no-cache")
    response.headers.set("x-is-authenticated", isAuthenticated.toString())
    response.headers.set("x-is-protected-route", isProtectedRoute.toString())
    response.headers.set("x-is-auth-route", isAuthRoute.toString())
  }

  // Redirect authenticated users away from auth pages to prevent loops
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && isProtectedRoute) {
    // Store the original URL to redirect back after login
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname)
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url))
  }

  // Check admin access
  if (isAdminRoute) {
    const isAdmin = token?.role === "ADMIN"

    if (!isAuthenticated || !isAdmin) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload/:path*",
    "/chat/:path*",
    "/admin/:path*",
    "/auth/login",
    "/auth/register",
    "/profile/:path*",
  ],
}
