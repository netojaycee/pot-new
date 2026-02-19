/**
 * Guest & User Session Detection Helper
 * 
 * Use this in your cart/order service endpoints to determine
 * if request is from authenticated user or guest
 */

import { getSession, SessionPayload } from "@/lib/auth";

export type RequestSession = 
  | { type: "user"; userId: string; role: string }
  | { type: "guest"; sessionId: string }
  | null;

/**
 * Get session info for cart/order operations
 * 
 * @returns Session info with user or guest identification
 * 
 * @example
 * const session = await getRequestSession();
 * 
 * if (session?.type === "user") {
 *   // User is authenticated
 *   const orders = await getOrdersByUserId(session.userId);
 * } else if (session?.type === "guest") {
 *   // Guest user
 *   const cart = await getCartBySessionId(session.sessionId);
 * } else {
 *   // No session (shouldn't happen - auto-created)
 * }
 */
export async function getRequestSession(): Promise<RequestSession> {
  try {
    const rawSession = await getSession();
    if (!rawSession) return null;

    // User session
    if ("userId" in rawSession) {
      return {
        type: "user",
        userId: rawSession.userId,
        role: rawSession.role,
      };
    }

    // Guest session
    if ("sessionId" in rawSession && rawSession.isGuest) {
      return {
        type: "guest",
        sessionId: rawSession.sessionId,
      };
    }

    return null;
  } catch (error) {
    console.error("Get request session error:", error);
    return null;
  }
}

/**
 * Check if session is authenticated user
 */
export function isUserSession(session: RequestSession): session is { type: "user"; userId: string; role: string } {
  return session?.type === "user";
}

/**
 * Check if session is guest
 */
export function isGuestSession(session: RequestSession): session is { type: "guest"; sessionId: string } {
  return session?.type === "guest";
}
