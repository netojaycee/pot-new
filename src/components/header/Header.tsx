import { Separator } from "@/components/ui/separator";
import LogoSection from "./LogoSection";
import SearchBar from "./SearchBar";
import UserActions from "./UserActions";
import Cart from "./Cart";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import CustomBreadcrumb from "./CustomBreadcrumb";
import { Heart, Gift } from "lucide-react";

export default function Header() {
  return (
    <div className="py-2 px-4 lg:px-16">
      <div className="">
        {/* Top Header: Logo, Search, and Icons */}
        <div className="flex items-center justify-between gap-4 md:gap-6">
          {/* Mobile Menu + Logo */}
          <div className="flex items-center gap-4 md:gap-6 min-w-0">
            <LogoSection />
          </div>

         

          {/* Right Icons and Actions */}
          <div className="flex items-center justify-end gap-4 md:gap-6 flex-1">
            {/* Search Bar - Takes available space */}
          <div className="hidden md:block flex-1 max-w-lg">
            <SearchBar />
          </div>
          
           {/* Wishlist Icon */}
            <button className="transition-all hover:text-primary duration-300 hover:scale-110 shrink-0">
              <Heart className="w-6 h-6" />
            </button>

            {/* Gift Icon */}
            <button className="transition-all hover:text-primary duration-300 hover:scale-110 shrink-0">
              <Gift className="w-6 h-6" />
            </button>

            {/* Cart Icon */}
            <Cart />

            {/* User Actions */}
            <UserActions />

            <MobileNav />
          </div>
        </div>

        {/* Mobile Search - Show below header on mobile */}
        <div className="md:hidden mt-4">
          <SearchBar />
        </div>

        {/* Desktop Navigation */}
        <DesktopNav />
      </div>

      {/* <Separator className="lg:block hidden mt-4" /> */}

      {/* Breadcrumb */}
      <div className="pt-4">
        <CustomBreadcrumb />
      </div>
    </div>
  );
}
