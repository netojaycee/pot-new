"use client";
import ChangePassword from "@/components/auth/ChangePassword";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoaderComponent from "@/app/loading";

export default function ResetPassword() {
  const router = useRouter();

  useEffect(() => {
    // Check localStorage and redirect if tokens are missing
    const storedEmail = localStorage.getItem("email");
    const storedToken = localStorage.getItem("resetToken");

    if (!storedEmail || !storedToken) {
      router.push("/auth/login");
    }
  }, [router]);

  // Get from localStorage - check synchronously for render
  const email =
    typeof window !== "undefined" ? localStorage.getItem("email") : null;
  const resetToken =
    typeof window !== "undefined" ? localStorage.getItem("resetToken") : null;

  // Show nothing while checking
  if (!email || !resetToken) {
    return <LoaderComponent />;
  }

  return (
    <div className="flex min-h-screen md:items-center md:justify-center bg-white">
      <ChangePassword email={email} resetToken={resetToken} />
    </div>
  );
}
