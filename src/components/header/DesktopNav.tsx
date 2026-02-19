import Link from "next/link";
import { navLinks } from "./navLinks";

// here we need to fetch categories for gifts and render starigt
// link will be category/type/:slug

export default function DesktopNav() {
  return (
    <div className="hidden lg:flex items-center justify-between mt-2">
      <div className="flex flex-wrap justify-between gap-3 w-[90%] items-center">
        <p className="text-sm font-medium tracking-wide text-[#A3A3A3]">Shop</p>
        <p>|</p>
        {navLinks.map((link) => (
          <div key={link.title}>
            {/* {link.children ? (
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className='uppercase text-sm font-normal transition-all hover:text-primary duration-300 hover:scale-105'>
                      {link.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className='grid w-[500px] space-x-2 md:grid-cols-4'>
                        {link.children.map((child) => (
                          <ListItem
                            className='uppercase'
                            key={child.title}
                            title={child.title}
                            href={child.href}
                          />
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            ) : ( */}
            <Link
              className="text-sm font-normal transition-all hover:text-primary duration-300 hover:scale-105"
              href={link.href}
            >
              {link.title}
            </Link>
            {/* )} */}
          </div>
        ))}
      </div>
    </div>
  );
}
