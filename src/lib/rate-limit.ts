import { redis } from "@/lib/redis";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // Unix timestamp when limit resets
  error?: string;
}

/**
 * Sliding-window rate limiter backed by Upstash Redis.
 *
 * @param identifier  Unique key (e.g. "login:user@example.com" or "login:127.0.0.1")
 * @param limit       Max allowed requests in the window
 * @param windowSecs  Window duration in seconds
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSecs: number,
): Promise<RateLimitResult> {
  const key = `rl:${identifier}`;

  try {
    const now = Date.now();
    const windowStart = now - windowSecs * 1000;

    // Remove entries older than the current window, then add the new request
    // Using a sorted set: score = timestamp, member = unique request id
    const requestId = `${now}-${Math.random()}`;

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, { score: now, member: requestId });
    pipeline.zcard(key);
    pipeline.expire(key, windowSecs);

    const results = await pipeline.exec();
    const count = results[2] as number;

    const reset = Math.ceil((now + windowSecs * 1000) / 1000);

    if (count > limit) {
      return {
        success: false,
        remaining: 0,
        reset,
        error: "Too many attempts. Please try again later.",
      };
    }

    return {
      success: true,
      remaining: Math.max(0, limit - count),
      reset,
    };
  } catch (error) {
    // Fail open — don't block users if Redis is temporarily unavailable
    console.error("[RateLimit] Redis error:", error);
    return { success: true, remaining: 1, reset: 0 };
  }
}

// ─── Pre-configured limiters ────────────────────────────────────────────────

/** 5 login attempts per email per 15 minutes */
export function loginRateLimit(email: string) {
  return rateLimit(`login:${email.toLowerCase()}`, 5, 900);
}

/** 3 OTP requests per email per 10 minutes */
export function otpRequestRateLimit(email: string) {
  return rateLimit(`otp_req:${email.toLowerCase()}`, 3, 600);
}

/** 10 OTP verification attempts per email per 15 minutes */
export function otpVerifyRateLimit(email: string) {
  return rateLimit(`otp_verify:${email.toLowerCase()}`, 10, 900);
}

/** 10 registrations per IP per hour */
export function registerRateLimit(ip: string) {
  return rateLimit(`register:${ip}`, 10, 3600);
}
