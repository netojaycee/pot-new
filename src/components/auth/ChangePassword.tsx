"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, EyeOff, Eye, Lock, ArrowRight } from "lucide-react";
import Logo from "../Logo";
import { ChangePasswordCredentials, changePasswordSchema } from "@/lib/schema";
import { changePasswordAction, resetPasswordAction } from "@/lib/actions/auth.actions";
import { z } from "zod";
import { PasswordStrength } from "./PasswordStrength";

// Schema for password reset (only new password)
const resetPasswordSchema = changePasswordSchema;

// Schema for change password in profile (current + new password)
const profileChangePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Current password is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
      "Password must contain uppercase, lowercase, and numbers"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface ChangePasswordProps {
  email?: string;
  resetToken?: string;
}

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
type ProfilePasswordValues = z.infer<typeof profileChangePasswordSchema>;

export default function ChangePassword({
  resetToken,
  email,
}: ChangePasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Determine which flow: password reset or profile change
  const isPasswordReset = !!resetToken;

  const form = useForm<ResetPasswordValues | ProfilePasswordValues>({
    resolver: zodResolver(isPasswordReset ? resetPasswordSchema : profileChangePasswordSchema),
    defaultValues: isPasswordReset 
      ? {
          password: "",
          confirmPassword: "",
        }
      : {
          currentPassword: "",
          password: "",
          confirmPassword: "",
        },
  });


// eslint-disable-next-line
  const passwordValue = form.watch("password");

  const onSubmit = async (values: ResetPasswordValues | ProfilePasswordValues) => {
    startTransition(async () => {
      try {
        if (isPasswordReset) {
          // Password reset flow (forgot password)
          const resetValues = values as ResetPasswordValues;
          console.log(email, resetValues.password, resetToken)
          const result = await resetPasswordAction({
            email: email || "",
            newPassword: resetValues.password,
            resetToken: resetToken,
          });

          if (!result.success) {
            toast.error(result.error || "Failed to change password");
            return;
          }

          toast.success("Password changed successfully! Please login with your new password.");
          // Clear localStorage if it exists
          if (typeof window !== "undefined") {
            localStorage.removeItem("email");
            localStorage.removeItem("resetToken");
          }
          router.push("/auth/login");
        } else {
          // Profile change password flow (authenticated user)
          const profileValues = values as ProfilePasswordValues;
          const result = await changePasswordAction({
            newPassword: profileValues.password,
            currentPassword: profileValues.currentPassword,
          });

          if (!result.success) {
            toast.error(result.error || "Failed to change password");
            return;
          }

          toast.success("Password changed successfully!");
          router.push("/account/security");
        }
      } catch (error) {
        console.error("Change password error:", error);
        toast.error("An unexpected error occurred");
      }
    });
  };

  return (
    <div className='w-full max-w-md p-6'>
   

      {/* Welcome Text */}
      <div className='mb-6 md:text-center text-left'>
        <h2 className='text-2xl md:text-3xl font-bold text-[#4A4A4A] font-montserrat'>
          {isPasswordReset ? "Create New Password" : "Change Your Password"}
        </h2>
        <p className='mt-1 text-sm text-gray-600'>
          {isPasswordReset
            ? "Use a strong password you can remember easily"
            : "Enter your current password and a new password"}
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          {/* Current Password Field - Only for profile change */}
          {!isPasswordReset && (
            <FormField
              control={form.control}
              name='currentPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-gray-700'>Current Password</FormLabel>
                  <div className='relative'>
                    <FormControl>
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder='Enter current password'
                        {...field}
                        disabled={isPending}
                        className='pl-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500'
                      />
                    </FormControl>
                    <Lock className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700' />
                    <button
                      type='button'
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                      disabled={isPending}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className='h-5 w-5' />
                      ) : (
                        <Eye className='h-5 w-5' />
                      )}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* New Password Field */}
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-gray-700'>
                  {isPasswordReset ? "New Password" : "New Password"}
                </FormLabel>
                <div className='relative'>
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder='********'
                      {...field}
                      disabled={isPending}
                      className='pl-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500'
                    />
                  </FormControl>
                  <Lock className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700' />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                    disabled={isPending}
                  >
                    {showPassword ? (
                      <EyeOff className='h-5 w-5' />
                    ) : (
                      <Eye className='h-5 w-5' />
                    )}
                  </button>
                </div>
                <FormMessage />
                {passwordValue && <PasswordStrength password={passwordValue} />}
              </FormItem>
            )}
          />

          {/* Confirm Password Field */}
          <FormField
            control={form.control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-gray-700'>
                  Confirm New Password
                </FormLabel>
                <div className='relative'>
                  <FormControl>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder='********'
                      {...field}
                      disabled={isPending}
                      className='pl-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500'
                    />
                  </FormControl>
                  <Lock className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700' />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                    disabled={isPending}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='h-5 w-5' />
                    ) : (
                      <Eye className='h-5 w-5' />
                    )}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type='submit'
            disabled={isPending}
            className='w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white'
          >
            {isPending ? (
              <>
                <Loader2 className='h-5 w-5 animate-spin' />
                <span>Please wait</span>
              </>
            ) : (
              <>
                <span>CONTINUE</span>
                <ArrowRight className='h-5 w-5' />
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
