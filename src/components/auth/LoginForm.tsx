// "use client";

// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import Link from "next/link"; // For navigation links

// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// const formSchema = z.object({
//   email: z.string().email(),
//   password: z.string().min(6),
// });

// export function LoginForm() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);

//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       email: "",
//       password: "",
//     },
//   });

//   async function onSubmit(values: z.infer<typeof formSchema>) {
//     setLoading(true);
//     try {
//       const res = await fetch("/api/v1/auth/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(values),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || "Login failed");
//       }

//       toast.success("Welcome back!");
//       router.push("/");
//       router.refresh();
//     } catch (error: any) {
//       toast.error(error.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <Card className="w-full max-w-md mx-auto">
//       <CardHeader>
//         <CardTitle>Login</CardTitle>
//         <CardDescription>Enter your credentials to access your account</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//             <FormField
//               control={form.control}
//               name="email"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Email</FormLabel>
//                   <FormControl>
//                     <Input placeholder="email@example.com" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="password"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Password</FormLabel>
//                   <FormControl>
//                     <Input type="password" placeholder="******" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <Button type="submit" className="w-full" disabled={loading}>
//               {loading ? "Logging in..." : "Login"}
//             </Button>
//           </form>
//         </Form>
//       </CardContent>
//       <CardFooter className="flex justify-center">
//         <p className="text-sm text-muted-foreground">
//           Don&apos;t have an account?{" "}
//           <Link href="/register" className="text-primary hover:underline">
//             Register
//           </Link>
//         </p>
//       </CardFooter>
//     </Card>
//   );
// }

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, Eye, EyeOff, ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";
import Logo from "../Logo";
import GoogleLoginButton from "./GoogleLoginButton";
import { loginAction } from "@/lib/actions/auth.actions";
import { loginSchema } from "@/lib/schema";

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    startTransition(async () => {
      try {
        const result = await loginAction(values);

        if (!result.success) {
          toast.error(result.error || "Login failed");
          return;
        }

        toast.success("Login successful!");

        // Check if email verification is needed
        if (result.needsVerification && result.email) {
          router.push(`/auth/verify-email?email=${encodeURIComponent(result.email)}`);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Login error:", error);
        toast.error("An error occurred during login");
      }
    });
  };

  return (
    <div className="w-full max-w-md p-6">

      {/* Welcome Text */}
      <div className="mb-6 text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-[#4A4A4A] font-montserrat">
          Welcome Back!
        </h2>
        <p className="mt-1 text-sm  text-gray-600">
          Enter your email and password to access your account
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Email address</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="example@gmail.com"
                      {...field}
                      disabled={isPending}
                      className="pl-10 border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </FormControl>
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      {...field}
                      disabled={isPending}
                      className="pl-10 border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </FormControl>

                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPending}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                disabled={isPending}
                className="border-primary data-[state=checked]:bg-primary"
              />
              <Label htmlFor="remember" className="text-sm text-gray-700">
                Remember me
              </Label>
            </div>
            <Link
              href={`/auth/code-request?type=forgot-password`}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Log In Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Please wait</span>
              </>
            ) : (
              <>
                <span>LOG IN</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>

          {/* Sign Up Link */}
          <div className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-bold underline text-primary">
              Sign Up
            </Link>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">OR</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <GoogleLoginButton title="Sign in with Google" disabled={isPending} />
        </form>
      </Form>
    </div>
  );
}
