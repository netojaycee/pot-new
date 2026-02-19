"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { OtpVerificationForm } from "@/components/auth/OtpVerificationForm";

export default function OtpVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email");
  const type = searchParams.get("type") as
    | "email_verification"
    | "password_reset"
    | "change_password"
    | "change_email"
    | null;
  const autoCode = searchParams.get("code");

  if (!email || !type) {
    return (
      <div className="w-full max-w-md p-6">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Invalid verification link</p>
          <p className="text-gray-600 mt-2">Please try again or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <OtpVerificationForm
      email={email}
      otpType={type}
      autoCode={autoCode || undefined}
      onSuccess={() => {
        // Redirect based on type
        if (type === "email_verification") {
          router.push("/");
        } else if (type === "password_reset") {
          router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
        } else if (type === "change_password") {
          router.push("/account/security");
        } else if (type === "change_email") {
          router.push("/account/settings");
        }
      }}
    />
  );
}
