"use client";

import { useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth.actions";
import Link from "next/link";

interface UserMenuProps {
  user: any; // Replace with User type from your schema
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logoutAction();
    } catch (error) {
      console.error("Logout error:", error);
    //   toast.error("Failed to logout");
      setIsLoading(false);
    }
  };

  return (
    <div className='relative items-center space-x-2 hidden md:flex'>
      <div className='relative'>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='flex items-center space-x-1 text-sm font-normal transition-all hover:text-primary duration-300 hover:scale-105 py-2 px-3 rounded'
        >
          <User className='w-4 h-4' />
          <span className='hidden sm:inline'>
            {user.firstName || user.email}
          </span>
          <ChevronDown className='w-4 h-4' />
        </button>

        {isOpen && (
          <div className='absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border border-gray-200'>
            {/* Header Section */}
            <div className='p-4 border-b border-gray-200'>
              <p className='text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3'>MY ACCOUNT</p>
              <p className='text-sm font-semibold text-gray-900'>{user.firstName} {user.lastName}</p>
              <p className='text-xs text-gray-500 mt-1'>{user.email}</p>
            </div>

            {/* Links Section */}
            <div className='py-2'>
              <Link
                href='/orders'
                className='block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                onClick={() => setIsOpen(false)}
              >
                Orders
              </Link>
              <Link
                href='/recently-viewed'
                className='block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                onClick={() => setIsOpen(false)}
              >
                Recently Viewed
              </Link>
              <Link
                href='/account'
                className='block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-200'
                onClick={() => setIsOpen(false)}
              >
                Account management
              </Link>
            </div>

            {/* Logout Section */}
            <div className='p-2'>
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className='w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded'
              >
                <LogOut className='w-4 h-4 inline mr-2' />
                <span>{isLoading ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
