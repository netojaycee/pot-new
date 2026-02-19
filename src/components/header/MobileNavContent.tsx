"use client";

import { useTransition, useRef } from "react";
import Link from "next/link";
import { SheetClose } from "@/components/ui/sheet";
import { Search, Loader2, ShoppingBag, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logoutAction } from "@/lib/actions/auth.actions";
import { toast } from "sonner";
import Logo from "../Logo";
import { navLinks } from "./navLinks";

interface MobileNavContentProps {
  user: any; // Replace with User type
}

export default function MobileNavContent({ user }: MobileNavContentProps) {
  const [isPending, startTransition] = useTransition();
  const closeSheetRef = useRef<HTMLButtonElement>(null);

  const handleLogout = async () => {
    startTransition(async () => {
      try {
        await logoutAction();
        // Close sheet after logout
        closeSheetRef.current?.click();
      } catch (error) {
        console.error("Logout error:", error);
      }
    });
  };

  const accountLinks = [
    { label: "Orders", href: "/orders" },
    { label: "Recently Viewed", href: "/recently-viewed" },
    { label: "Account management", href: "/account-management" },
  ];

  return (
    <div className="flex flex-col h-full">
      <Logo />
      {/* Search Bar */}
      <div className="mb-6 mt-3">
        <div className="relative">
          <Input
            placeholder="Search for anything..."
            className="pl-10 pr-3 py-2 text-sm"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* My Account Section */}
        {user && (
          <div className="mb-8 border border-gray-300 rounded">
            <div className="bg-gray-100 px-3 py-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              <p className="text-sm font-bold uppercase text-gray-700">
                My Account
              </p>
            </div>
            <ul className="">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <SheetClose asChild>
                    <Link
                      href={link.href}
                      className="block text-sm font-normal text-gray-800 hover:text-primary transition-colors px-3 py-3 underline"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Shop Section */}
        <div className="mb-8 border border-gray-300 rounded">
          <div className="bg-gray-100 px-3 py-2 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <p className="text-sm font-bold uppercase text-gray-700">Shop</p>
          </div>
          <ul className="">
            {navLinks.map((category) => (
              <li key={category.href}>
                <SheetClose asChild>
                  <Link
                    href={category.href}
                    className="block text-sm font-normal text-gray-800 hover:text-primary transition-colors px-3 py-3 underline"
                  >
                    {category.title}
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 pt-4 space-y-4">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="px-2 py-3">
              <p className="text-xs font-semibold">
                {user?.firstName || "John"} {user?.lastName || "Doe"}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email || "john.doe@example.com"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </button>
            {/* Hidden SheetClose to programmatically close sheet on logout */}
            <SheetClose ref={closeSheetRef} className="hidden" />
          </div>
        ) : (
          <>
            <SheetClose asChild>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/auth/login">Get Started</Link>
              </Button>
            </SheetClose>
          </>
        )}
      </div>
    </div>
  );
}
