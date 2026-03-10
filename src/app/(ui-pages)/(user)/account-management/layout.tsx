"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Menu,
  User,
  Package,
  Shield,
  LogOut,
  ChevronRight,
  Settings,
  Settings2,
  UserRoundX,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { logoutAction } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";

const mainMenuItems = [
  {
    label: "Dashboard",
    href: "/account-management",
    icon: User,
    description: "Overview of your account",
  },
  {
    label: "Profile",
    href: "/account-management/profile",
    icon: User,
    description: "Edit personal info about yourself",
  },
  // {
  //   label: "Delivery addresses",
  //   href: "/account-management/delivery-addresses",
  //   icon: Package,
  //   description: "View saved addresses from past orders",
  // },
  {
    label: "Account security",
    href: "/account-management/security",
    icon: Shield,
    description: "Change password, two factor auth, login device",
  },
];

const additionalMenuItems = [
  {
    label: "Delete account",
    href: "/account-management/delete-account",
    icon: UserRoundX,
    description: "Close your account permanently",
  },
  {
    label: "Log out",
    href: "/account-management/logout",
    icon: LogOut,
    description: "Log out your account from this device",
  },
];

// Sidebar Menu Content - Shared by Desktop and Mobile
function SidebarMenuContent({
  useSheetClose = false,
  onLogout,
  isLoading = false,
}: {
  useSheetClose?: boolean;
  onLogout?: () => void;
  isLoading?: boolean;
}) {
  const MenuLink = ({
    item,
    isLogout,
  }: {
    item: (typeof mainMenuItems)[0] | (typeof additionalMenuItems)[0];
    isLogout?: boolean;
  }) => {
    const Icon = item.icon;

    // Handle logout button
    if (isLogout) {
      const buttonElement = (
        <button
          onClick={onLogout}
          className="w-full block p-2 border border-gray-200 rounded hover:border-gray-300 transition group text-left"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              {isLoading ? <Loader2 className="w-5 h-5 shrink-0 text-gray-600 animate-spin" /> : <Icon className="w-5 h-5 shrink-0 text-gray-600" />}
              <div>
                <h3 className="font-semibold text-sm text-gray-900">
                  {item.label}
                </h3>
                <p className="text-xs text-gray-600 mt-1">{item.description}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 shrink-0 mt-0.5 text-gray-400 group-hover:translate-x-0.5 transition" />
          </div>
        </button>
      );

      if (useSheetClose) {
        return (
          <SheetClose asChild key="logout">
            {buttonElement}
          </SheetClose>
        );
      }
      return buttonElement;
    }

    // Regular link items
    const linkElement = (
      <Link
        key={item.href}
        href={item.href}
        className="block p-2 border border-gray-200 rounded hover:border-gray-300 transition group"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Icon className="w-5 h-5 shrink-0 text-gray-600" />
            <div>
              <h3 className="font-semibold text-sm text-gray-900">
                {item.label}
              </h3>
              <p className="text-xs text-gray-600 mt-1">{item.description}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0 mt-0.5 text-gray-400 group-hover:translate-x-0.5 transition" />
        </div>
      </Link>
    );

    if (useSheetClose) {
      return (
        <SheetClose asChild key={item.href}>
          {linkElement}
        </SheetClose>
      );
    }

    return linkElement;
  };
  return (
    <>
      {/* Main Menu Section */}
      <div className="space-y-4 border rounded mb-6 md:mb-10">
        {/* SETTINGS Header Box */}
        <div className="flex items-center gap-2 p-2 bg-[#FAFAFA] border border-gray-200">
          <Settings className="w-4 h-4 text-gray-600 shrink-0" />
          <h2 className="text-sm font-semibold text-gray-900">SETTINGS</h2>
        </div>

        {/* SETTINGS Nav Items */}
        <nav className="space-y-3 p-2">
          {mainMenuItems.map((item) => (
            <MenuLink key={item.href} item={item} />
          ))}
        </nav>
      </div>

      {/* Additional Settings Section */}
      <div className="space-y-4 border rounded">
        {/* ADDITIONAL SETTINGS Header Box */}
        <div className="flex items-center gap-2 p-2 bg-[#FAFAFA] border border-gray-200">
          <Settings2 className="w-4 h-4 text-gray-600 shrink-0" />
          <h2 className="text-sm font-semibold text-gray-900">
            ADDITIONAL SETTINGS
          </h2>
        </div>

        {/* ADDITIONAL SETTINGS Nav Items */}
        <nav className="space-y-3 p-2">
          {additionalMenuItems.map((item) => (
            <MenuLink
              key={item.href}
              item={item}
              isLogout={item.label === "Log out"}
            />
          ))}
        </nav>
      </div>
    </>
  );
}

export default function AccountManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const handleLogout = () => {
    startTransition(async () => {
      try {
        await logoutAction();
        router.push("/auth/login");
      } catch (error) {
        console.error("Logout error:", error);
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen px-4 lg:px-16 md:py-8 gap-5">
      {/* Mobile Header with Sheet Trigger */}
      <div className="lg:hidden sticky top-0 bg-white border-b border-gray-200 z-20">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Account</h1>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded transition">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            {/* Mobile Sheet - Constrained to Content Height */}
            <SheetContent
              side="left"
              showCloseButton={true}
              className="w-full sm:max-w-sm p-0 overflow-hidden"
              // style={{
              //   height: "calc(100vh - 73px)",
              //   maxHeight: "calc(100vh - 73px)",
              //   top: "73px"
              // }}
            >
              <SheetTitle className="sr-only">Account Menu</SheetTitle>
              <SheetDescription className="sr-only">Menu</SheetDescription>
              <div className="overflow-y-auto h-full p-4">
                <SidebarMenuContent
                  useSheetClose={true}
                  onLogout={handleLogout}
                  isLoading={isPending}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar - Static and Always Visible */}
      <div className="hidden lg:block lg:w-80 lg:min-h-screen">
        <div className="sticky top-0">
          <SidebarMenuContent useSheetClose={false} onLogout={handleLogout} isLoading={isPending} />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 rounded">
        <div className="bg-white rounded shadow-sm lg:shadow-md">
          {children}
        </div>
      </div>
    </div>
  );
}
