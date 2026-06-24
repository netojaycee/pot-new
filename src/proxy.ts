import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "pot_session";
const key = new TextEncoder().encode(process.env.JWT_SECRET!);

const ADMIN_PREFIX = "/admin";
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/code-request"];
// Routes that require a real (non-guest) authenticated user
const USER_PROTECTED = ["/account-management", "/orders"];

async function getSessionPayload(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload as { userId?: string; role?: string; isGuest?: boolean; sessionId?: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // ── Admin routes: require authenticated admin ─────────────────────────────
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await getSessionPayload(token);
    if (!session?.userId || session.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // ── User-protected routes: require real authenticated user ────────────────
  // /account-management/* and /orders (list only — individual order pages are public)
  const isUserProtected =
    USER_PROTECTED.some((p) => pathname.startsWith(p)) &&
    !(pathname.startsWith("/orders/") && pathname.length > "/orders/".length);

  if (isUserProtected) {
    const session = token ? await getSessionPayload(token) : null;
    if (!session?.userId) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Auth pages: redirect already-logged-in users to home ─────────────────
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    if (token) {
      const session = await getSessionPayload(token);
      if (session?.userId) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  // ── Security headers on all responses ────────────────────────────────────
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico and public static assets
     * - api/v1/webhooks (Stripe must bypass auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$|api/v1/webhooks).*)",
  ],
};
