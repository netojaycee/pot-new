"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  authService,
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  ChangePasswordInput,
  OtpType,
} from "@/lib/services/auth.service";
import { encrypt, decrypt, getSession } from "@/lib/auth";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME!;

// Helper: Create session cookie
export async function setSessionCookie(userId: string, role: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({
    userId,
    role,
    expires,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

// Helper: Delete session cookie
export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Helper: Get current user (for authenticated users only)
export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) return null;

    return await authService.validateSession(session.userId);
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

// ============ REGISTRATION ============
export async function registerAction(input: RegisterInput): Promise<{
  success: boolean;
  error?: string;
  code?: string;
  userId?: string;
}> {
  try {
    const result = await authService.register(input);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      };
    }

    return {
      success: true,
      userId: result.data.userId,
    };
  } catch (error) {
    console.error("Register action error:", error);
    return {
      success: false,
      error: "Registration failed",
      code: "REGISTRATION_ERROR",
    };
  }
}

// ============ VERIFY EMAIL OTP ============
export async function verifyEmailOtpAction(
  userId: string,
  code: string,
  otpType: OtpType = "email_verification",
): Promise<{
  success: boolean;
  error?: string;
  code?: string;
  resetToken?: string; // For password_reset flow
}> {
  try {
    const result = await authService.verifyEmailOtp(userId, code, otpType);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      };
    }

    // For password reset, return resetToken (short-lived, ~15 min)
    if (otpType === "password_reset") {
      // Generate a short-lived reset token
      const resetToken = await encrypt({
        email: userId,
        type: "password_reset",
        expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      return {
        success: true,
        resetToken,
      };
    }
    if (otpType === "email_verification") {
      const user = result.data.user;
      await setSessionCookie(user.id, user.role);

      revalidatePath("/");
      redirect("/");
    }

    return { success: true };
  } catch (error) {
    console.error("Verify email OTP action error:", error);
    return {
      success: false,
      error: "Email verification failed",
      code: "VERIFICATION_ERROR",
    };
  }
}

// ============ LOGIN ============
export async function loginAction(input: LoginInput): Promise<{
  success: boolean;
  error?: string;
  code?: string;
  needsVerification?: boolean;
  email?: string;
}> {
  try {
    const result = await authService.login(input);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      };
    }

    // Check if user needs email verification
    if (result.data.needsVerification) {
      // Return email for OTP verification page
      return {
        success: true,
        needsVerification: true,
        email: result.data.user.email,
      };
    }

    // Create session
    const user = result.data.user;
    await setSessionCookie(user.id, user.role);

    return { success: true };
  } catch (error) {
    console.error("Login action error:", error);
    return {
      success: false,
      error: "Login failed",
      code: "LOGIN_ERROR",
    };
  }
}

// ============ GOOGLE LOGIN ============
// export async function googleLoginAction(idToken: string): Promise<{
//   success: boolean;
//   error?: string;
//   code?: string;
//   email?: string;
// }> {
//   try {
//     // Verify token with Google (you'll need to implement this)
//     // For now, we'll assume the token is valid and comes with decoded claims
//     const decodedToken = await verifyGoogleToken(idToken);

//     if (!decodedToken) {
//       return {
//         success: false,
//         error: "Invalid Google token",
//         code: "INVALID_TOKEN",
//       };
//     }

//     const result = await authService.loginWithGoogle(
//       decodedToken.sub,
//       decodedToken.email,
//       decodedToken.given_name,
//       decodedToken.family_name,
//       decodedToken.picture
//     );

//     if (!result.success) {
//       return {
//         success: false,
//         error: result.error,
//         code: result.code,
//       };
//     }

//     // Google accounts are always verified, create session immediately
//     const user = result.data.user;
//     await setSessionCookie(user.id, user.role);

//     revalidatePath("/");
//     redirect("/");
//   } catch (error) {
//     console.error("Google login action error:", error);
//     return {
//       success: false,
//       error: "Google sign-in failed",
//       code: "GOOGLE_LOGIN_ERROR",
//     };
//   }
// }

// ============ HELPER: Verify Google Token ============
async function verifyGoogleToken(token: string) {
  try {
    // Verify with Google's tokeninfo endpoint
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`,
    );

    if (!response.ok) {
      return null;
    }

    const decoded = await response.json();

    // Alternatively, you can use google-auth-library:
    // import { OAuth2Client } from 'google-auth-library';
    // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    // const ticket = await client.verifyIdToken({
    //   idToken: token,
    //   audience: process.env.GOOGLE_CLIENT_ID,
    // });
    // return ticket.getPayload();

    return decoded;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// ============ FORGOT PASSWORD ============
export async function forgotPasswordAction(email: string): Promise<{
  success: boolean;
  error?: string;
  code?: string;
}> {
  try {
    const result = await authService.requestPasswordReset(email);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Forgot password action error:", error);
    return {
      success: false,
      error: "Failed to process request",
      code: "RESET_REQUEST_ERROR",
    };
  }
}

// ============ RESET PASSWORD ============
export async function resetPasswordAction(input: ResetPasswordInput): Promise<{
  success: boolean;
  error?: string;
  code?: string;
}> {
  try {
    try {
      const decoded = await decrypt(input.resetToken);

      if (new Date() > new Date(decoded.expires)) {
        return {
          success: false,
          error: "Reset token has expired",
          code: "TOKEN_EXPIRED",
        };
      }

      // Verify email matches
      if (decoded.email !== input.email) {
        return {
          success: false,
          error: "Email mismatch",
          code: "EMAIL_MISMATCH",
        };
      }
    } catch {
      return {
        success: false,
        error: "Invalid reset token",
        code: "INVALID_TOKEN",
      };
    }
    const result = await authService.resetPassword(input);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      };
    }

    // Success - client will handle redirect
    return { success: true };
  } catch (error) {
    // Don't catch NEXT_REDIRECT errors
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Reset password action error:", error);
    return {
      success: false,
      error: "Password reset failed",
      code: "RESET_ERROR",
    };
  }
}

// ============ CHANGE PASSWORD FLOW ============
export async function changePasswordAction(input: {
  newPassword: string;
  currentPassword: string;
}): Promise<{
  success: boolean;
  error?: string;
  code?: string;
}> {
  try {
    // Get authenticated user from session
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized - please log in",
        code: "UNAUTHORIZED",
      };
    }

    // Change password with current password verification
    const result = await authService.changePassword({
      userId: user.id,
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Change password action error:", error);
    return {
      success: false,
      error: "Password change failed",
      code: "CHANGE_PASSWORD_ERROR",
    };
  }
}

// ============ GOOGLE OAUTH ============
export async function googleLoginAction(token: string): Promise<{
  success: boolean;
  error?: string;
  code?: string;
}> {
  try {
    // Decode JWT token (without verification for now, Google signs it)
    const decoded = decodeGoogleToken(token);

    if (!decoded) {
      return {
        success: false,
        error: "Invalid Google token",
        code: "INVALID_TOKEN",
      };
    }

    // Extract claims from decoded token
    const result = await authService.loginWithGoogle(
      decoded.sub,
      decoded.email,
      decoded.given_name,
      decoded.family_name,
      decoded.picture,
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      };
    }

    // Create session
    const user = result.data.user;
    await setSessionCookie(user.id, user.role);

    revalidatePath("/");
    redirect("/auth/login");
  } catch (error) {
    console.error("Google login action error:", error);
    return {
      success: false,
      error: "Google sign-in failed",
      code: "GOOGLE_LOGIN_ERROR",
    };
  }
}

// ============ HELPER: Decode Google JWT Token ============
function decodeGoogleToken(token: string) {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decode payload (second part)
    const payload = parts[1];
    // Add padding if needed
    const padded = payload + "==".substring(0, (4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString());

    return decoded;
  } catch (error) {
    console.error("Failed to decode Google token:", error);
    return null;
  }
}

// ============ LOGOUT ============
export async function logoutAction(): Promise<void> {
  try {
    await deleteSessionCookie();
    revalidatePath("/");
    // redirect("/");
  } catch (error) {
    console.error("Logout action error:", error);
    // redirect("/");
  }
}

// ============ RESEND OTP ============
export async function resendOtpAction(
  email: string,
  otpType: OtpType,
): Promise<{
  success: boolean;
  error?: string;
  code?: string;
  expiresAt?: Date;
}> {
  try {
    const type = otpType;
    const result = await authService.resendOtp(email, type);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      };
    }

    return {
      success: true,
      expiresAt: result.data.expiresAt,
    };
  } catch (error) {
    console.error("Resend OTP action error:", error);
    return {
      success: false,
      error: "Failed to resend code",
      code: "RESEND_ERROR",
    };
  }
}

// ============ GET CURRENT SESSION (for client components) ============
// Returns user session or guest session info
export async function getCurrentSessionInfoAction() {
  try {
    const session = await getSession();
    if (!session) return null;

    // If user session
    if ("userId" in session) {
      const user = await authService.validateSession(session.userId);
      return user ? { type: "user" as const, data: user } : null;
    }

    // If guest session
    if ("sessionId" in session && session.isGuest) {
      return {
        type: "guest" as const,
        data: { sessionId: session.sessionId },
      };
    }

    return null;
  } catch (error) {
    console.error("Get current session action error:", error);
    return null;
  }
}
