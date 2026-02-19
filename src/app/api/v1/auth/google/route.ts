import { NextRequest, NextResponse } from "next/server";

const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI}` || "http://localhost:3000/api/v1/auth/google/callback";

// GET /api/v1/auth/google
// Initiates Google OAuth flow - redirects user to Google login
export async function GET(req: NextRequest) {
  try {
    const url = new URL(GOOGLE_OAUTH_URL);
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("access_type", "offline");

    return NextResponse.redirect(url.toString());
  } catch (error) {
    console.error("Google OAuth initiation error:", error);
    return NextResponse.redirect("/auth/login?error=oauth_init_failed");
  }
}
