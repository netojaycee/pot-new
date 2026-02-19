// "use client";

// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import Link from "next/link";

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
//   firstName: z.string().min(1, "First name is required"),
//   lastName: z.string().min(1, "Last name is required"),
//   email: z.string().email(),
//   password: z.string().min(6, "Password must be at least 6 characters"),
// });

// export function RegisterForm() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);

//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       firstName: "",
//       lastName: "",
//       email: "",
//       password: "",
//     },
//   });

//   async function onSubmit(values: z.infer<typeof formSchema>) {
//     setLoading(true);
//     try {
//       const res = await fetch("/api/v1/auth/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(values),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || "Registration failed");
//       }

//       toast.success("Account created! Please login.");
//       router.push("/login");
//     } catch (error: any) {
//       toast.error(error.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <Card className="w-full max-w-md mx-auto">
//       <CardHeader>
//         <CardTitle>Register</CardTitle>
//         <CardDescription>Create a new account to get started</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <FormField
//                 control={form.control}
//                 name="firstName"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>First Name</FormLabel>
//                     <FormControl>
//                       <Input placeholder="John" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="lastName"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Last Name</FormLabel>
//                     <FormControl>
//                       <Input placeholder="Doe" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>
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
//               {loading ? "Creating account..." : "Register"}
//             </Button>
//           </form>
//         </Form>
//       </CardContent>
//       <CardFooter className="flex justify-center">
//         <p className="text-sm text-muted-foreground">
//           Already have an account?{" "}
//           <Link href="/login" className="text-primary hover:underline">
//             Login
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
import {
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  Mail,
  User,
} from "lucide-react";
import Link from "next/link";
import { registerSchema } from "@/lib/schema";
import Logo from "../Logo";
import GoogleLoginButton from "./GoogleLoginButton";
import { registerAction } from "@/lib/actions/auth.actions";
import { z } from "zod";
import { PasswordStrength } from "./PasswordStrength";

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Watch password field for real-time validation
  // eslint-disable-next-line
  const password = form.watch("password");

  const onSubmit = async (values: RegisterFormData) => {
    startTransition(async () => {
      try {
        const result = await registerAction({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
        });

        if (!result.success) {
          toast.error(result.error || "Registration failed");
          return;
        }

        toast.success(
          "Account created! Check your email for verification code.",
        );
        // Redirect to verification page with email
        router.push(
          `/auth/verify-email?email=${encodeURIComponent(values.email)}`,
        );
      } catch (error) {
        console.error("Register error:", error);
        toast.error("An error occurred during registration");
      }
    });
  };

  return (
    <div className="w-full max-w-md p-6">
      {/* Welcome Text */}
      <div className="mb-6  text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-[#4A4A4A] font-montserrat">
          Create an account
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Enter your name, email and password to create an account
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-gray-700">First Name</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="john"
                        {...field}
                        disabled={isPending}
                        className="pl-10 border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </FormControl>
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-gray-700">Last Name</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="doe"
                        {...field}
                        disabled={isPending}
                        className="pl-10 border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </FormControl>
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
          {/* <div className="flex flex-col md:flex-row gap-4"> */}
            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="w-full">
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
                  {/* Real-time password strength feedback */}
                  <PasswordStrength password={password} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-gray-700">
                    Confirm Password
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="********"
                        {...field}
                        disabled={isPending}
                        className="pl-10 border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </FormControl>

                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isPending}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      {showConfirmPassword ? (
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
          {/* </div> */}
          {/* Sign Up Button */}
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
                <span>SIGN UP</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>

          {/* Login Link */}
          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-bold underline text-primary"
            >
              Log In
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
          <GoogleLoginButton
            title="Continue with Google"
            disabled={isPending}
          />
        </form>
      </Form>
    </div>
  );
}
