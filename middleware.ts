import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const publicRoutes = ["/auth/login", "/auth/register", "/"]

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isPublicRoute = publicRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  )
  const isApiRoute = nextUrl.pathname.startsWith("/api/")
  const isAuthCallback = nextUrl.pathname.startsWith("/api/auth/")

  if (isAuthCallback) return

  if (isApiRoute && !isLoggedIn) {
    return NextResponse.json(
      { success: false, error: "No autorizado" },
      { status: 401 }
    )
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl))
  }

  if (isLoggedIn && nextUrl.pathname === "/") {
    const role = req.auth?.user?.role
    if (role === "PROFESSIONAL") {
      return NextResponse.redirect(new URL("/dashboard/professional", nextUrl))
    }
    return NextResponse.redirect(new URL("/dashboard/client", nextUrl))
  }

  if (nextUrl.pathname.startsWith("/dashboard/professional")) {
    if (req.auth?.user?.role !== "PROFESSIONAL") {
      return NextResponse.redirect(new URL("/dashboard/client", nextUrl))
    }
  }

  if (nextUrl.pathname.startsWith("/dashboard/client")) {
    if (req.auth?.user?.role === "PROFESSIONAL") {
      return NextResponse.redirect(new URL("/dashboard/professional", nextUrl))
    }
  }
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:png|jpg|jpeg|gif|svg|ico)$).*)",
  ],
}
