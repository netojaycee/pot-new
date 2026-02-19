import { authService } from "./auth.service";
import { z } from "zod";

// Types
export type GoogleOAuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// Validation Schemas
export const googleAuthCallbackSchema = z.object({
  code: z.string().min(1, "Authorization code required"),
  state: z.string().min(1, "State parameter required"),
  redirectUri: z.string().url("Invalid redirect URI"),
});

export const googleUserInfoSchema = z.object({
  sub: z.string(), // Google ID
  email: z.string().email(),
  name: z.string().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  picture: z.string().url().optional(),
  email_verified: z.boolean().default(true),
});

export type GoogleAuthCallbackInput = z.infer<typeof googleAuthCallbackSchema>;
export type GoogleUserInfo = z.infer<typeof googleUserInfoSchema>;

export const googleOAuthService = {
  /**
   * Get Google OAuth authorization URL
   * Used to redirect user to Google login
   */
  getAuthorizationUrl(state: string, redirectUri: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const scope = ["profile", "email"].join(" ");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope,
      state,
      access_type: "offline", // Request refresh token
      prompt: "consent",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<GoogleOAuthResult<any>> {
    try {
      const tokenUrl = "https://oauth2.googleapis.com/token";

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error_description || "Failed to exchange code for token",
          code: "TOKEN_EXCHANGE_FAILED",
        };
      }

      const tokenData = await response.json();

      return {
        success: true,
        data: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in,
          idToken: tokenData.id_token,
        },
      };
    } catch (error) {
      console.error("Exchange code for token error:", error);
      return {
        success: false,
        error: "Failed to exchange code for token",
        code: "EXCHANGE_ERROR",
      };
    }
  },

  /**
   * Get user info from Google using access token
   */
  async getUserInfo(accessToken: string): Promise<GoogleOAuthResult<GoogleUserInfo>> {
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Failed to fetch user info",
          code: "USER_INFO_FAILED",
        };
      }

      const userInfo = await response.json();

      // Validate user info
      const validated = googleUserInfoSchema.safeParse(userInfo);
      if (!validated.success) {
        return {
          success: false,
          error: "Invalid user info from Google",
          code: "VALIDATION_ERROR",
        };
      }

      return { success: true, data: validated.data };
    } catch (error) {
      console.error("Get user info error:", error);
      return {
        success: false,
        error: "Failed to fetch user info",
        code: "FETCH_ERROR",
      };
    }
  },

  /**
   * Handle Google OAuth callback
   * Main entry point: gets code, exchanges for token, fetches user info, creates/logs in user
   */
  async handleCallback(input: GoogleAuthCallbackInput): Promise<GoogleOAuthResult<{ user: any; isNewUser: boolean; cartMergeSessionId?: string }>> {
    try {
      const validated = googleAuthCallbackSchema.safeParse(input);
      if (!validated.success) {
        return {
          success: false,
          error: validated.error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }

      // 1. Exchange code for token
      const tokenResult = await googleOAuthService.exchangeCodeForToken(
        validated.data.code,
        validated.data.redirectUri
      );

      if (!tokenResult.success) {
        return tokenResult as any;
      }

      // 2. Get user info
      const userInfoResult = await googleOAuthService.getUserInfo(tokenResult.data.accessToken);

      if (!userInfoResult.success) {
        return userInfoResult as any;
      }

      const googleUserInfo = userInfoResult.data;

      // 3. Login or create user via auth service
      const authResult = await authService.loginWithGoogle(
        googleUserInfo.sub,
        googleUserInfo.email,
        googleUserInfo.given_name,
        googleUserInfo.family_name,
        googleUserInfo.picture
      );

      if (!authResult.success) {
        return authResult as any;
      }

      return {
        success: true,
        data: {
          user: authResult.data.user,
          isNewUser: authResult.data.isNewUser,
        },
      };
    } catch (error) {
      console.error("Handle Google callback error:", error);
      return {
        success: false,
        error: "Failed to process Google sign-in",
        code: "CALLBACK_ERROR",
      };
    }
  },

  /**
   * Verify state parameter (CSRF protection)
   * Store state in session/cache before redirecting to Google
   */
  generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },

  /**
   * Get callback URL for current environment
   */
  getCallbackUrl(): string {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000";
    const url = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
    return `${url}/auth/google/callback`;
  },
};
