import { googleOAuthService } from "@/lib/services/google-oauth.service";

/**
 * Client-side utilities for authentication flows
 */

// Generate Google OAuth login URL
export function getGoogleAuthUrl(): string {
  const state = googleOAuthService.generateState();
  const redirectUri = googleOAuthService.getCallbackUrl();

  // Store state in sessionStorage for CSRF protection
  if (typeof window !== "undefined") {
    sessionStorage.setItem("google_auth_state", state);
  }

  return googleOAuthService.getAuthorizationUrl(state, redirectUri);
}

// Verify state parameter on callback
export function verifyGoogleAuthState(state: string): boolean {
  if (typeof window === "undefined") return false;

  const storedState = sessionStorage.getItem("google_auth_state");
  const isValid = storedState === state;

  // Clear stored state
  sessionStorage.removeItem("google_auth_state");

  return isValid;
}

// Extract auth code from URL params
export function getAuthCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  return params.get("code");
}

// Check for auth errors in URL
export function getAuthErrorFromUrl(): {
  error: string;
  errorDescription: string;
} | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");

  if (!error) return null;

  return {
    error,
    errorDescription: params.get("error_description") || "",
  };
}

// Redirect to Google login
export function redirectToGoogleLogin(): void {
  const url = getGoogleAuthUrl();
  window.location.href = url;
}

// Handle Google callback (returns auth code if valid, null if error)
export function handleGoogleCallback(): {
  code: string | null;
  error: { error: string; errorDescription: string } | null;
} {
  const error = getAuthErrorFromUrl();
  if (error) {
    return { code: null, error };
  }

  const code = getAuthCodeFromUrl();
  return { code, error: null };
}
