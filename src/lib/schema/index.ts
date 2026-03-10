import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const verifySchema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
    type: z.enum(["register", "forgot-password"]),
});

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  phone: z.string().optional(),
  image: z.string().url().optional(),
});


export const sendOtpSchema = z.object({
    email: z.string().email(),
    // type: z.enum(["register", "forgot-password"]), // Differentiate between flows
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});


export type ChangePasswordCredentials = z.infer<typeof changePasswordSchema>;
export type SendOtpCredentials = z.infer<typeof sendOtpSchema>;
export type RegisterCredentials = z.infer<typeof registerSchema>;
export type VerifyCredentials = z.infer<typeof verifySchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;