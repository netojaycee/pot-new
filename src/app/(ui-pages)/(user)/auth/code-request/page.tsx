"use client";
import EmailForm from "@/components/auth/EmailForm";
import { useSearchParams } from "next/navigation";
import React from "react";

export default function CodeRequest() {
  const searchParams = useSearchParams();
  const type =
    searchParams.get("type") === "register" ||
    searchParams.get("type") === "forgot-password"
      ? (searchParams.get("type") as "register" | "forgot-password")
      : "register";
  if (!type) {
    return <div>Error: Missing type</div>;
  }
  return (
    <div className='flex min-h-screen md:items-center md:justify-center bg-white'>
      <EmailForm type={type} />
    </div>
  );
}
