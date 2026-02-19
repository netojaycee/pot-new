import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createId as cuid } from "@paralleldrive/cuid2";

const SECRET_KEY = process.env.JWT_SECRET!;
const _SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME!;
const key = new TextEncoder().encode(SECRET_KEY);

export type SessionPayload = 
  | { userId: string; role: string; expires: Date }
  | { sessionId: string; isGuest: true; expires: Date };

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

/**
 * Get current session (user or guest)
 * Returns null if no session exists (guest hasn't taken action yet)
 * Only authenticated users and guests who took action have sessions
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(_SESSION_COOKIE_NAME)?.value;
  
  if (!session) {
    return null;
  }

  return await decrypt(session);
}

/**
 * Get or create a guest session
 * Call this only when guest takes a major action (add to cart, checkout, etc.)
 * Creates sessionId and persists to cookie if doesn't exist
 */
export async function getOrCreateGuestSession(): Promise<SessionPayload> {
  const session = await getSession();
  
  // If user is authenticated, return their session
  if (session && "userId" in session) {
    return session;
  }
  
  // If guest session already exists, return it
  if (session && session.isGuest) {
    return session;
  }

  // No session exists - create guest session
  const guestSession: SessionPayload = {
    sessionId: cuid(),
    isGuest: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  const encryptedSession = await encrypt(guestSession);
  const cookieStore = await cookies();
  cookieStore.set(_SESSION_COOKIE_NAME, encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: guestSession.expires,
  });

  return guestSession;
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get(_SESSION_COOKIE_NAME)?.value;
  if (!session) return;

  // Refresh expiration logic if needed
  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: _SESSION_COOKIE_NAME,
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
  });
  return res;
}
