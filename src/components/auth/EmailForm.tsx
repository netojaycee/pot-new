"use client";

import { useTransition } from "react";
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
import { Loader2, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import Logo from "../Logo";
import { SendOtpCredentials, sendOtpSchema } from "@/lib/schema";
import { forgotPasswordAction } from "@/lib/actions/auth.actions";

export default function EmailForm({ type = 'forgot-password' }: any) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SendOtpCredentials>({
    resolver: zodResolver(sendOtpSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: SendOtpCredentials) => {
    startTransition(async () => {
      try {
        // For forgot password, call forgotPasswordAction
        if (type === "forgot-password") {
          const result = await forgotPasswordAction(values.email);
          
          if (!result.success) {
            toast.error(result.error || "Failed to send OTP");
            return;
          }

          toast.success("OTP sent successfully! Check your email.");
          router.push(
            `/auth/otp-verification?email=${encodeURIComponent(values.email)}&type=password_reset`
          );
        } else {
          // For registration, OTP is sent during registration, then user clicks link in email
          // This form shouldn't be used for registration - it's only for forgot password
          // But keeping this for compatibility if needed
          toast.error("Please use the registration form");
        }
      } catch (error) {
        console.error("Send OTP error:", error);
        toast.error("An unexpected error occurred");
      }
    });
  };

  return (
    <div className='w-full max-w-md p-6'>
    

      {/* Welcome Text */}
      <div className='mb-6 text-left'>
        <h2 className='text-2xl md:text-3xl font-bold text-[#4A4A4A] font-montserrat'>
          Reset Your Password
        </h2>
        <p className='mt-1 text-sm text-gray-600'>
          Enter your email to receive a verification code
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          {/* Email Field */}
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-gray-700'>Email address</FormLabel>
                <div className='relative'>
                  <FormControl>
                    <Input
                      placeholder='example@gmail.com'
                      {...field}
                      disabled={isPending}
                      className='pl-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500'
                    />
                  </FormControl>
                  <Mail className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700' />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Send OTP Button */}
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
                <span>SEND CODE</span>
                <ArrowRight className='h-5 w-5' />
              </>
            )}
          </Button>

          {/* Back to Login Link */}
          <div className='text-center text-sm text-gray-600'>
            <>
              Remembered your password?{" "}
              <Link href='/auth/login' className='font-bold hover:underline'>
                Log In
              </Link>
            </>
          </div>
        </form>
      </Form>
    </div>
  );
}
