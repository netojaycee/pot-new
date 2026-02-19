import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  // Update session expiration if session exists
  const response = await updateSession(request);
  if (response) return response;

  const currentUser = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;
  
  // Protect /admin routes (example) - can expand logic here
  if (request.nextUrl.pathname.startsWith("/admin") && !currentUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Protect /account routes
  if (request.nextUrl.pathname.startsWith("/account") && !currentUser) {
    return NextResponse.redirect(new URL("/login", request.url));
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
