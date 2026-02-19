"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  verifyEmailOtpAction,
  resendOtpAction,
} from "@/lib/actions/auth.actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { OTPInput } from "./OTPInput";
import { Loader2, AlertCircle, Mail, Info } from "lucide-react";
import Logo from "../Logo";

// Validation schema
const otpSchema = z.object({
  code: z
    .string()
    .length(4, "OTP must be 4 characters")
    .regex(/^[a-zA-Z0-9]+$/, "OTP must contain only letters and numbers"),
});

type OtpFormValues = z.infer<typeof otpSchema>;

interface OtpVerificationFormProps {
  email: string;
  userId?: string;
  otpType?:
    | "email_verification"
    | "password_reset"
    | "change_password"
    | "change_email";
  onSuccess?: () => void;
  showBackButton?: boolean;
  autoCode?: string;
}

export function OtpVerificationForm({
  email,
  userId = "",
  otpType = "email_verification",
  onSuccess,
  showBackButton = true,
  autoCode,
}: OtpVerificationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const form = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: autoCode || "",
    },
  });

  // Auto-submit if code is provided in URL
  useEffect(() => {
    if (autoCode && autoCode.length === 4 && !isPending) {
      const timer = setTimeout(() => {
        handleSubmit(autoCode);
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCode, isPending]);

  const handleSubmit = (code: string) => {
    startTransition(async () => {
      try {
        console.log(userId, email, code, otpType)
        const result = await verifyEmailOtpAction(
          userId || email,
          code,
          otpType,
        );

        if (!result.success) {
          if (result.code === "INVALID_OTP") {
            toast.error("Invalid OTP code. Please try again.");
            form.setError("code", { message: "Invalid OTP code" });
          } else if (result.code === "OTP_EXPIRED") {
            toast.error("OTP has expired. Please request a new one.");
            form.setError("code", { message: "OTP has expired" });
          } else if (result.code === "USER_NOT_FOUND") {
            toast.error("User not found. Please try registering again.");
            router.push("/auth/register");
          } else {
            toast.error(
              result.error || "Verification failed. Please try again.",
            );
          }
          return;
        }

        // Handle password reset flow - store resetToken and redirect
        if (otpType === "password_reset" && result.resetToken) {
          if (typeof window !== "undefined") {
            localStorage.setItem("email", email);
            localStorage.setItem("resetToken", result.resetToken);
          }
          toast.success("Email verified! Please create a new password.");
          router.push(
            `/auth/reset-password?email=${encodeURIComponent(email)}`,
          );
          return;
        }

        // Success for other types
        toast.success("Email verified successfully!");
        if (onSuccess) {
          onSuccess();
        } else {
          // Default redirect
          router.push("/");
        }
      } catch (error) {
        console.error("OTP verification error:", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  };
  //         } else {
  //           toast.error(
  //             result.error || "Verification failed. Please try again.",
  //           );
  //         }
  //         return;
  //       }

  //       // Success
  //       toast.success("Email verified successfully!");
  //       if (onSuccess) {
  //         onSuccess();
  //       } else {
  //         // Default redirect
  //         router.push("/");
  //       }
  //     } catch (error) {
  //       console.error("OTP verification error:", error);
  //       toast.error("An unexpected error occurred. Please try again.");
  //     }
  //   });
  // };

  async function onFormSubmit(data: OtpFormValues) {
    handleSubmit(data.code);
  }

  async function handleResendOtp() {
    try {
      setIsResending(true);

      const result = await resendOtpAction(email, otpType);

      if (!result.success) {
        toast.error(result.error || "Failed to resend OTP. Please try again.");
        return;
      }

      toast.success("OTP resent successfully! Check your email.");

      // Set cooldown timer
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  const getTitle = () => {
    switch (otpType) {
      case "password_reset":
        return "Reset Your Password";
      case "change_password":
        return "Confirm Password Change";
      case "change_email":
        return "Verify New Email";
      default:
        return "Verify Your Email";
    }
  };

  const getDescription = () => {
    switch (otpType) {
      case "password_reset":
        return `We've sent a verification code to ${email}`;
      case "change_password":
        return `We've sent a verification code to ${email}`;
      case "change_email":
        return `We've sent a verification code to ${email}`;
      default:
        return `We've sent a verification code to ${email}. Enter it below.`;
    }
  };

  return (
    <div className="w-full max-w-md p-6">
      {/* Welcome Text */}
      <div className="mb-6 text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-[#4A4A4A] font-montserrat">
          {getTitle()}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{getDescription()}</p>
      </div>

      {/* Auto-submit indicator */}
      {autoCode && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Quick verification</p>
            <p className="text-xs mt-1">Submitting code from link...</p>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-gray-700 text-base block">
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <span>Enter Verification Code</span>
                  </div>
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <div className="flex justify-start">
                      <OTPInput
                        length={4}
                        value={field.value}
                        onChange={field.onChange}
                        onComplete={(otp) => handleSubmit(otp)}
                        disabled={isPending || isResending}
                        autoFocus={!autoCode}
                      />
                    </div>
                    {resendCooldown > 0 ? (
                      <p className="text-blue-800 flex items-center gap-1">
                        <Info className="w-4 h-4" /> You can resend OTP in{" "}
                        {resendCooldown}s
                      </p>
                    ) : (
                      <Button
                        variant="link"
                        onClick={handleResendOtp}
                        disabled={isResending || isPending}
                        className="text-red-600 underline p-0"
                      >
                        {isResending ? "Resending..." : "Resend code"}
                      </Button>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isPending || isResending}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify Code</span>
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6 space-y-4">
        {/* Back Button */}
        {showBackButton && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.back()}
            disabled={isPending || isResending}
          >
            Go Back
          </Button>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <p className="font-semibold mb-1">⏱️ Code expires in 10 minutes</p>
        <p>
          Enter the 4-character code we sent to your email. You can also click
          the link in the email to verify instantly.
        </p>
      </div>
    </div>
  );
}
