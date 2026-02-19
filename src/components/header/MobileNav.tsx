import { Menu } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/auth.actions";
import { getCategoriesAction } from "@/lib/actions/category.actions";
import MobileNavContent from "./MobileNavContent";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navLinks } from "./navLinks";

export default async function MobileNav() {
  const user = await getCurrentUser();
  const result = await getCategoriesAction({ type: "giftbox" });
  const categories = result.success ? result.data : navLinks;
  // console.log(categories)

  return (
    <div className="">
      <Sheet>
        <SheetTrigger asChild>
          <Menu className="w-6 h-6 lg:hidden cursor-pointer hover:text-primary transition-colors" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-4">
          <SheetTitle className="sr-only">Sidebar</SheetTitle>
          <MobileNavContent user={user} categories={categories as any} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
