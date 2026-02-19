"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function GoogleLoginButton({
  title,
  disabled,
}: {
  title: string;
  disabled?: boolean;
}) {
  const handleGoogleSignIn = () => {
    // Simple redirect to OAuth initiation endpoint
    window.location.href = "/api/v1/auth/google";
  };

  return (
    <Button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={disabled}
      variant="outline"
      className="w-full flex items-center justify-center gap-2 border-gray-300"
    >
      <Image src="/google.png" alt="Google" width={20} height={20} />
      <span>{title}</span>
    </Button>
  );
}
