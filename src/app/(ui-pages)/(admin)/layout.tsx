"use client"
import { Providers } from "@/components/providers/providers";
import { Divide } from "lucide-react";
import { Toaster } from "sonner";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
        {/*admin header here */}
          {children}
          {/* admin footer here */}
          </div>
  );
}
