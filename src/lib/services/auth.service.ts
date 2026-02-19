import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { z } from "zod";
import { generateOtpCode } from "@/lib/utils";
import { render } from "@react-email/render";
import OtpEmail from "@/emails/auth/OtpEmail";
import { sendEmail } from "@/lib/email";


// Types
export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

export type OtpType =
  | "email_verification"
  | "password_reset"
  | "change_password"
  | "change_email";

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

// Validation Schemas
const emailSchema = z.string().email();
const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(1, "Name is required");
const otpCodeSchema = z
  .string()
  .length(4, "OTP must be 4 characters")
  .regex(/^[a-zA-Z0-9]+$/, "OTP must be alphanumeric");

// Helper: Send OTP email using React Email template and centralized sendEmail utility
async function sendOtpEmail(
  email: string,
  firstName: string,
  otpCode: string,
  type: OtpType,
): Promise<boolean> {
  try {
    // Render React Email template to HTML
    const html = await render(
      OtpEmail({ email, firstName, otp: otpCode, type }),
    );

    const subjectMap: Record<OtpType, string> = {
      email_verification: "Verify your email address",
      password_reset: "Reset your password",
      change_password: "Confirm password change",
      change_email: "Verify new email address",
    };

    // Use centralized sendEmail utility with domain auto-formatting
    const result = await sendEmail({
      from: "noreply", // Will be auto-formatted to noreply@fevico.com.ng
      to: email,
      subject: subjectMap[type],
      html,
    });

    if (!result.success) {
      console.error(
        `[OTP Email Error] Failed to send ${type} OTP to ${email}:`,
        result.error,
      );
      return false;
    }

    console.log(
      `[OTP Email Sent] ${type} OTP sent to ${email}, MessageId: ${result.messageId}`,
    );
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}

// Helper: Generate OTP and save to database
async function generateAndSaveOtp(
  userId: string,
  type: OtpType,
): Promise<{ code: string; expiresAt: Date } | null> {
  try {
    // Delete any existing OTP of this type for this user
    await prisma.otp.deleteMany({
      where: {
        userId,
        type,
      },
    });

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otp.create({
      data: {
        userId,
        code,
        type,
        expiresAt,
      },
    });

    return { code, expiresAt };
  } catch (error) {
    console.error("Failed to generate OTP:", error);
    return null;
  }
}

// Main Service Functions

export const authService = {
  // ============ REGISTRATION ============
  async register(
    input: RegisterInput,
  ): Promise<AuthResult<{ userId: string }>> {
    try {
      // Validate input with safeParse
      const firstNameResult = nameSchema.safeParse(input.firstName);
      if (!firstNameResult.success) {
        return {
          success: false,
          error: "First name is required",
          code: "VALIDATION_ERROR",
        };
      }

      const lastNameResult = nameSchema.safeParse(input.lastName);
      if (!lastNameResult.success) {
        return {
          success: false,
          error: "Last name is required",
          code: "VALIDATION_ERROR",
        };
      }

      const emailResult = emailSchema.safeParse(input.email);
      if (!emailResult.success) {
        return {
          success: false,
          error: "Invalid email format",
          code: "VALIDATION_ERROR",
        };
      }

      const passwordResult = passwordSchema.safeParse(input.password);
      if (!passwordResult.success) {
        return {
          success: false,
          error:
            (passwordResult.error as any).errors[0]?.message ||
            "Password validation failed",
          code: "VALIDATION_ERROR",
        };
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: emailResult.data },
      });

      if (existingUser) {
        return {
          success: false,
          error: "Email already registered",
          code: "USER_EXISTS",
        };
      }

      // Hash password
      const hashedPassword = await hashPassword(passwordResult.data);

      // Create user (unverified)
      const user = await prisma.user.create({
        data: {
          firstName: firstNameResult.data,
          lastName: lastNameResult.data,
          email: emailResult.data,
          password: hashedPassword,
          verified: false,
        },
      });

      // Generate and save OTP
      const otpData = await generateAndSaveOtp(user.id, "email_verification");
      if (!otpData) {
        return {
          success: false,
          error: "Failed to generate verification code",
          code: "OTP_GENERATION_FAILED",
        };
      }

      // Send OTP email
      const emailSent = await sendOtpEmail(
        emailResult.data,
        firstNameResult.data,
        otpData.code,
        "email_verification",
      );

      if (!emailSent) {
        console.warn(`Email verification OTP not sent to ${emailResult.data}`);
      }

      return {
        success: true,
        data: { userId: user.id },
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: "Registration failed",
        code: "REGISTRATION_ERROR",
      };
    }
  },

  // ============ VERIFY EMAIL OTP ============
  // Handles OTP verification for multiple flows: email_verification, password_reset, etc.
  // Accepts email + code + type, finds OTP, validates, and returns type-specific response
  async verifyEmailOtp(
    emailOrUserId: string,
    code: string,
    otpType: OtpType = "email_verification",
  ): Promise<AuthResult<{ user?: any; resetToken?: string }>> {
    try {

      const type = otpType;

      console.log(emailOrUserId, code, type)
      // Validate OTP code format
      const codeResult = otpCodeSchema.safeParse(code);
      if (!codeResult.success) {
        return {
          success: false,
          error: "Invalid OTP format",
          code: "VALIDATION_ERROR",
        };
      }

      // Determine if input is email or userId
      let user: any;
      if (emailOrUserId.includes("@")) {
        // It's an email
        user = await prisma.user.findUnique({
          where: { email: emailOrUserId },
        });
      } else {
        // It's a userId
        user = await prisma.user.findUnique({
          where: { id: emailOrUserId },
        });
      }

      if (!user) {
        return {
          success: false,
          error: "User not found",
          code: "USER_NOT_FOUND",
        };
      }

      // Find OTP by email, code, and type
      const otp = await prisma.otp.findFirst({
        where: {
          userId: user.id,
          code: codeResult.data,
          type,
        },
      });

      if (!otp) {
        return {
          success: false,
          error: "Invalid verification code",
          code: "INVALID_OTP",
        };
      }

      // Check if expired
      if (new Date() > otp.expiresAt) {
        await prisma.otp.delete({ where: { id: otp.id } });
        return {
          success: false,
          error: "Verification code expired",
          code: "OTP_EXPIRED",
        };
      }

      // Delete used OTP
      await prisma.otp.delete({ where: { id: otp.id } });

      // Handle different OTP types
      if (type === "password_reset") {
        // For forgot password: return resetToken (frontend will store in localStorage)
        // Note: The actual resetToken is created in the action layer with encrypt()
        return {
          success: true,
          data: {
            user: { id: user.id, email: user.email },
          },
        };
      } else if (type === "email_verification") {
        // For email verification: mark user as verified
        if (user.verified) {
          return {
            success: false,
            error: "Email already verified",
            code: "ALREADY_VERIFIED",
          };
        }

        const verifiedUser = await prisma.user.update({
          where: { id: user.id },
          data: { verified: true },
        });

        // Return user for auto-login
        const { password, ...userWithoutPassword } = verifiedUser;
        return {
          success: true,
          data: { user: userWithoutPassword },
        };
      } else if (type === "change_password") {
        // For changing password when logged in - just verify OTP
        const { password, ...userWithoutPassword } = user;
        return {
          success: true,
          data: { user: userWithoutPassword },
        };
      } else if (type === "change_email") {
        // For changing email - just verify OTP
        const { password, ...userWithoutPassword } = user;
        return {
          success: true,
          data: { user: userWithoutPassword },
        };
      }

      return {
        success: true,
        data: { user: { id: user.id } },
      };
    } catch (error) {
      console.error("Email verification error:", error);
      return {
        success: false,
        error: "Email verification failed",
        code: "VERIFICATION_ERROR",
      };
    }
  },

  // ============ LOGIN ============
  async login(
    input: LoginInput,
  ): Promise<AuthResult<{ user: any; needsVerification: boolean }>> {
    try {
      // Validate input
      const emailResult = emailSchema.safeParse(input.email);
      if (!emailResult.success) {
        return {
          success: false,
          error: "Invalid email format",
          code: "VALIDATION_ERROR",
        };
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: emailResult.data },
      });

      if (!user || !user.password) {
        return {
          success: false,
          error: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        };
      }

      // Verify password
      const isPasswordValid = await verifyPassword(
        input.password,
        user.password,
      );

      if (!isPasswordValid) {
        return {
          success: false,
          error: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        };
      }

      // Check if email is verified
      if (!user.verified) {
        // Generate and send OTP instead of logging in
        const otpData = await generateAndSaveOtp(user.id, "email_verification");
        if (otpData) {
          await sendOtpEmail(
            user.email,
            user.firstName,
            otpData.code,
            "email_verification",
          );
        }

        const { password, ...userWithoutPassword } = user;
        return {
          success: true,
          data: {
            user: userWithoutPassword,
            needsVerification: true,
          },
        };
      }

      // Return user (without password)
      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          needsVerification: false,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "Login failed",
        code: "LOGIN_ERROR",
      };
    }
  },

  // ============ FORGOT PASSWORD ============
  async requestPasswordReset(email: string): Promise<AuthResult<void>> {
    try {
      // Validate email
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        // Don't reveal validation error for security
        return {
          success: true,
          data: undefined,
        };
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: emailResult.data },
      });

      if (!user) {
        // Don't reveal if user exists (security best practice)
        return {
          success: true,
          data: undefined,
        };
      }

      // Generate and save OTP
      const otpData = await generateAndSaveOtp(user.id, "password_reset");
      if (!otpData) {
        return {
          success: false,
          error: "Failed to generate reset code",
          code: "OTP_GENERATION_FAILED",
        };
      }

      // Send OTP email
      const emailSent = await sendOtpEmail(
        emailResult.data,
        user.firstName,
        otpData.code,
        "password_reset",
      );

      if (!emailSent) {
        console.warn(`Password reset OTP not sent to ${emailResult.data}`);
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error("Password reset request error:", error);
      return {
        success: false,
        error: "Failed to process request",
        code: "RESET_REQUEST_ERROR",
      };
    }
  },

  // ============ RESET PASSWORD ============
  async resetPassword(input: ResetPasswordInput): Promise<AuthResult<void>> {
    try {
      // Validate input with safeParse
      const emailResult = emailSchema.safeParse(input.email);
      if (!emailResult.success) {
        return {
          success: false,
          error: "Invalid email format",
          code: "VALIDATION_ERROR",
        };
      }

      const passwordResult = passwordSchema.safeParse(input.newPassword);
      if (!passwordResult.success) {
        return {
          success: false,
          error:
            (passwordResult.error as any).errors[0]?.message ||
            "Password validation failed",
          code: "VALIDATION_ERROR",
        };
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: emailResult.data },
      });

      console.log(user)

      if (!user) {
        return {
          success: false,
          error: "User not found",
          code: "USER_NOT_FOUND",
        };
      }

      // Hash new password
      const hashedPassword = await hashPassword(passwordResult.data);

      // Update user password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return { success: true, data: undefined };
    } catch (error) {
      console.error("Password reset error:", error);
      return {
        success: false,
        error: "Password reset failed",
        code: "RESET_ERROR",
      };
    }
  },

  // ============ CHANGE PASSWORD (Authenticated) ============
  async changePassword(input: ChangePasswordInput): Promise<AuthResult<void>> {
    try {
      // Validate new password with safeParse
      const passwordResult = passwordSchema.safeParse(input.newPassword);
      if (!passwordResult.success) {
        return {
          success: false,
          error:
            (passwordResult.error as any).errors[0]?.message ||
            "Password validation failed",
          code: "VALIDATION_ERROR",
        };
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user || !user.password) {
        return {
          success: false,
          error: "User not found",
          code: "USER_NOT_FOUND",
        };
      }

      // Verify current password
      const isPasswordValid = await verifyPassword(
        input.currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        return {
          success: false,
          error: "Current password is incorrect",
          code: "INVALID_PASSWORD",
        };
      }

      // Hash new password
      const hashedPassword = await hashPassword(passwordResult.data);

      // Update password
      await prisma.user.update({
        where: { id: input.userId },
        data: { password: hashedPassword },
      });

      return { success: true, data: undefined };
    } catch (error) {
      console.error("Change password error:", error);
      return {
        success: false,
        error: "Password change failed",
        code: "CHANGE_PASSWORD_ERROR",
      };
    }
  },

  async loginWithGoogle(
    googleId: string,
    email: string,
    firstName?: string,
    lastName?: string,
    image?: string,
  ): Promise<AuthResult<{ user: any; isNewUser: boolean }>> {
    try {
      // Validate input
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        return {
          success: false,
          error: "Invalid email format",
          code: "VALIDATION_ERROR",
        };
      }

      // Format image as JSON object with url and pubId
      const imageData = image ? { url: image, pubId: "" } : null;

      // Find or create user
      const user = await prisma.user.findUnique({
        where: { googleId },
      });

      if (user) {
        // User exists, return it
        const { password, ...userWithoutPassword } = user;
        return {
          success: true,
          data: {
            user: userWithoutPassword,
            isNewUser: false,
          },
        };
      }

      // Check if user with this email exists
      const existingUser = await prisma.user.findUnique({
        where: { email: emailResult.data },
      });

      if (existingUser && !existingUser.googleId) {
        // Email exists but no Google ID - link Google ID to existing account
        const updateData: any = { googleId };
        if (imageData) {
          updateData.image = imageData;
        }
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: updateData,
        });
        const { password, ...userWithoutPassword } = updated;
        return {
          success: true,
          data: {
            user: userWithoutPassword,
            isNewUser: false,
          },
        };
      }

      // Create new user (automatically verified for Google accounts)
      const createData: any = {
        googleId,
        email: emailResult.data,
        firstName: firstName || "User",
        lastName: lastName || "",
        verified: true, // Google-verified emails are considered verified
      };
      if (imageData) {
        createData.image = imageData;
      }
      const newUser = await prisma.user.create({
        data: createData,
      });

      const { password, ...userWithoutPassword } = newUser;

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          isNewUser: true,
        },
      };
    } catch (error) {
      console.error("Google login error:", error);
      return {
        success: false,
        error: "Google sign-in failed",
        code: "GOOGLE_LOGIN_ERROR",
      };
    }
  },

  // ============ VALIDATE SESSION ============
  async validateSession(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          verified: true,
          image: true,
        },
      });

      return user || null;
    } catch (error) {
      console.error("Session validation error:", error);
      return null;
    }
  },

  // ============ RESEND OTP ============
  async resendOtp(
    email: string,
    type: OtpType,
  ): Promise<AuthResult<{ expiresAt: Date }>> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return {
          success: false,
          error: "User not found",
          code: "USER_NOT_FOUND",
        };
      }

      // Generate and save OTP
      const otpData = await generateAndSaveOtp(user.id, type);
      if (!otpData) {
        return {
          success: false,
          error: "Failed to generate code",
          code: "OTP_GENERATION_FAILED",
        };
      }

      // Send OTP email
      const emailSent = await sendOtpEmail(
        user.email,
        user.firstName,
        otpData.code,
        type,
      );

      if (!emailSent) {
        console.warn(`OTP not sent to ${user.email}`);
      }

      return {
        success: true,
        data: { expiresAt: otpData.expiresAt },
      };
    } catch (error) {
      console.error("Resend OTP error:", error);
      return {
        success: false,
        error: "Failed to resend code",
        code: "RESEND_ERROR",
      };
    }
  },

  // ============ GOOGLE OAUTH HELPERS ============
  async exchangeCodeForToken(code: string): Promise<string | null> {
    try {
      const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
      const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
      const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/v1/auth/google/callback`;

      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }).toString(),
      });

      if (!response.ok) {
        console.error(
          "Failed to exchange code for token:",
          await response.text(),
        );
        return null;
      }

      const data = await response.json();
      return data.id_token;
    } catch (error) {
      console.error("Token exchange error:", error);
      return null;
    }
  },

  decodeToken(token: string): any {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const padded =
        payload + "==".substring(0, (4 - (payload.length % 4)) % 4);
      const decoded = JSON.parse(Buffer.from(padded, "base64").toString());

      return decoded;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  },

  // ============ HANDLE GOOGLE CALLBACK ============
  // Complete Google OAuth callback handling - exchanges code and creates/logs in user
  async handleGoogleCallback(
    code: string,
  ): Promise<AuthResult<{ user: any; isNewUser: boolean }>> {
    try {
      // Exchange code for ID token
      const idToken = await authService.exchangeCodeForToken(code);
      if (!idToken) {
        return {
          success: false,
          error: "Failed to exchange code for token",
          code: "TOKEN_EXCHANGE_ERROR",
        };
      }

      // Decode token
      const decoded = authService.decodeToken(idToken);
      if (!decoded) {
        return {
          success: false,
          error: "Failed to decode token",
          code: "TOKEN_DECODE_ERROR",
        };
      }

      // Login with Google using decoded claims
      return await authService.loginWithGoogle(
        decoded.sub,
        decoded.email,
        decoded.given_name,
        decoded.family_name,
        decoded.picture,
      );
    } catch (error) {
      console.error("Google callback error:", error);
      return {
        success: false,
        error: "Google authentication failed",
        code: "GOOGLE_AUTH_ERROR",
      };
    }
  },
};
