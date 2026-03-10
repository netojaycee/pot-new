import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession, updateSession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  // Update session expiration if session exists
  const response = await getSession();
  const currentUser = response && "userId" in response ? response : null;
  const userRole = currentUser && currentUser?.role;

  // const currentUser = request.cookies.get(
  //   process.env.SESSION_COOKIE_NAME!,
  // )?.value;


  // TODO: Add role check for admin routes when user model includes role
  if (request.nextUrl.pathname.startsWith("/admin") && userRole !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protect /account-management routes - authenticated users only
  if (
    request.nextUrl.pathname.startsWith("/account-management") &&
    !currentUser
  ) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Protect /orders list page - authenticated users only
  // Allow /orders/[orderNumber] for external tracking (public accessible)
  if (
    (request.nextUrl.pathname === "/orders" ||
      request.nextUrl.pathname === "/orders/") &&
    !currentUser
  ) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
