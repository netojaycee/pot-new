import { cookies } from "next/headers";
import { encrypt } from "@/lib/auth";
import { authService } from "@/lib/services/auth.service";
import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/actions/auth.actions";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME!;

// ============ HELPER: Create Session Cookie ============
// async function setSessionCookie(userId: string, role: string) {
//   const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
//   const session = await encrypt({
//     userId,
//     role,
//     expires,
//   });

//   const cookieStore = await cookies();
//   cookieStore.set(SESSION_COOKIE_NAME, session, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     path: "/",
//     expires,
//   });
// }

// GET /api/v1/auth/google/callback?code=...
// Handles Google OAuth callback - calls service for everything else
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Check for errors from Google
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Check if code exists
    if (!code) {
      console.error("No authorization code received");
      return NextResponse.redirect(
        new URL("/auth/login?error=no_code", request.url)
      );
    }

    // Call service to handle everything (exchange code, decode, login/create user)
    const result = await authService.handleGoogleCallback(code);

    if (!result.success) {
      console.error("Google auth service error:", result.error);
      return NextResponse.redirect(
        new URL(
          `/auth/login?error=${encodeURIComponent(result.error)}`,
          request.url
        )
      );
    }

    // Create session cookie
    const user = result.data.user;
    await setSessionCookie(user.id, user.role);

    // Redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Google callback route error:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=callback_failed", request.url)
    );
  }
}

