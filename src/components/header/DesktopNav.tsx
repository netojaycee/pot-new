import Link from "next/link";
import { getCategoriesAction } from "@/lib/actions/category.actions";
import { navLinks } from "./navLinks";

export default async function DesktopNav() {
  // Fetch giftbox categories dynamically
  const result = await getCategoriesAction({ type: "giftbox", limit: 8 });
  const categories = result.success ? result.data : navLinks;

  return (
    <div className="hidden lg:flex items-center justify-between mt-2">
      <div className="flex gap-5 items-center">
        <p className="text-sm font-medium tracking-wide text-[#A3A3A3]">Shop</p>
        <p>|</p>

        {/* Gift Packages Link - All Categories */}
        <Link
          className="text-sm font-normal transition-all hover:text-primary duration-300 hover:scale-105"
          href="/categories"
        >
          Gift Packages
        </Link>

        {/* Separator between gift packages and categories */}
        {/* {categories && categories.length > 0 && <p>|</p>} */}

        {/* Dynamic Category Links */}
        {categories &&
          categories.map((category: any) => (
            <Link
              key={category.id}
              className="text-sm font-normal transition-all hover:text-primary duration-300 hover:scale-105"
              href={`/category/${category.type}/${category.slug}`}
            >
              {category.name || category.title}
            </Link>
          ))}
      </div>
    </div>
  );
}
