"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  onChange?: (otp: string) => void;
  value?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({
  length = 4,
  onComplete,
  onChange,
  value = "",
  className,
  disabled = false,
  autoFocus = true,
}) => {
  // Initialize and derive OTP state from value prop
  const derivedOtp = React.useMemo(() => {
    if (value) {
      const otpArray = value.split("").slice(0, length);
      return [...otpArray, ...new Array(length - otpArray.length).fill("")];
    }
    return new Array(length).fill("");
  }, [value, length]);

  const [otp, setOtp] = useState<string[]>(derivedOtp);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync local state with prop when value changes externally
  React.useEffect(() => {
    setOtp(derivedOtp);
  }, [derivedOtp]);

  // Auto focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (index: number, digit: string) => {
    // Allow only alphanumeric characters
    if (digit && !/^[a-zA-Z0-9]$/.test(digit)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    const otpString = newOtp.join("");
    onChange?.(otpString);

    // Auto focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete when all fields are filled
    if (newOtp.every((d) => d !== "") && newOtp.length === length) {
      onComplete?.(otpString);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        // Clear current field
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
        onChange?.(newOtp.join(""));
      } else if (index > 0) {
        // Move to previous field
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        onChange?.(newOtp.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const alphanumeric = pastedData.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    if (alphanumeric) {
      const newOtp = new Array(length).fill("");
      for (let i = 0; i < Math.min(alphanumeric.length, length); i++) {
        newOtp[i] = alphanumeric[i];
      }
      setOtp(newOtp);
      onChange?.(newOtp.join(""));

      // Focus next empty field or last field
      const nextEmptyIndex = newOtp.findIndex((digit) => digit === "");
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();

      // Check if complete
      if (newOtp.every((d) => d !== "")) {
        onComplete?.(newOtp.join(""));
      }
    }
  };

  const handleFocus = (index: number) => {
    // Select all text when focused
    inputRefs.current[index]?.select();
  };

  return (
    <div className="space-y-4">
      {" "}
      <p className="">{otp.length}-digit code</p>
      <div className={cn("flex gap-3 w-full", className)}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[a-zA-Z0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={() => handleFocus(index)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              "w-12 h-12 md:w-14 md:h-14 text-center text-lg font-semibold",
              "border-2 rounded-sm transition-all duration-200",
              "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
              "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50",
              digit
                ? "border-primary bg-primary/5 text-primary"
                : "border-gray-300 bg-white text-gray-900 hover:border-gray-400",
            )}
            aria-label={`Digit ${index + 1} of ${length}`}
          />
        ))}
      </div>
    </div>
  );
};

export { OTPInput, type OTPInputProps };
