"use client";

import { LayoutDashboard, Settings } from "lucide-react";

export default function AccountSettingsPage() {
  return (
    <div className="space-y-4">
      {/* Header */}

      <div className="flex items-center gap-2 p-2 bg-[#FAFAFA] border border-gray-200">
        <LayoutDashboard className="w-4 h-4 text-gray-600 shrink-0" />
        <h2 className="text-sm font-semibold text-gray-900 uppercase">
        Dashboard
        </h2>
      </div>
      <div className="space-y-4 p-4 md:p-6">
        {/* Welcome Header */}
        <div className="text-center py-8 max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Your Account
          </h1>
          <p className="text-gray-600 mt-4 text-lg">
            Manage your profile, security settings, and delivery preferences
            from the menu on the left.
          </p>
        </div>

        {/* Quick Stats or Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-blue-600 mb-2">100%</div>
            <p className="text-sm text-gray-700">Profile Completion</p>
          </div>
          <div className="p-6 bg-green-50 rounded-lg border border-green-100">
            <div className="text-2xl font-bold text-green-600 mb-2">2FA</div>
            <p className="text-sm text-gray-700">Security Enabled</p>
          </div>
          <div className="p-6 bg-purple-50 rounded-lg border border-purple-100">
            <div className="text-2xl font-bold text-purple-600 mb-2">3</div>
            <p className="text-sm text-gray-700">Saved Addresses</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Account Tip</h3>
          <p className="text-sm text-gray-600">
            Keep your account secure by regularly updating your password and
            enabling two-factor authentication in the Account Security section.
          </p>
        </div>
      </div>
    </div>
  );
}
