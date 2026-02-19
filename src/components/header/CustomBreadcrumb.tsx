"use client";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

// Optional: Custom display names for URL segments
const displayNames: { [key: string]: string } = {
  docs: "Documentation",
  components: "Components",
  // Add more mappings as needed
};

interface BreadcrumbSegment {
  label: string;
  href: string;
}

export default function CustomBreadcrumb() {
  const pathname = usePathname();

  // Don't show breadcrumb on landing page or auth pages
  if (pathname === "/" || pathname.startsWith("/auth")) {
    return null;
  }

  // Split the pathname into segments and filter out empty segments
  const pathSegments = pathname.split("/").filter((segment) => segment);

  // Generate breadcrumb segments
  const breadcrumbSegments: BreadcrumbSegment[] = pathSegments.map(
    (segment, index) => {
      // Construct the href for each segment by joining all segments up to the current one
      const href = "/" + pathSegments.slice(0, index + 1).join("/");
      // Use custom display name if available, otherwise capitalize the segment
      const label =
        displayNames[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);
      return { label, href };
    }
  );

  // Add "Home" as the first segment
  const segments: BreadcrumbSegment[] = [
    { label: "Home", href: "/" },
    ...breadcrumbSegments,
  ];

  // Threshold for when to show the dropdown (e.g., more than 3 segments total)
  const maxVisibleSegments = 3;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Always show the first segment (Home) */}
        <BreadcrumbItem>
          <BreadcrumbLink href={segments[0].href}>
            {segments[0].label}
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.length > 1 && <BreadcrumbSeparator />}

        {/* If there are more segments than the max visible threshold, collapse intermediates into a dropdown */}
        {segments.length > maxVisibleSegments ? (
          <>
            {/* Dropdown for intermediate segments */}
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className='flex items-center gap-1'>
                  <BreadcrumbEllipsis className='h-4 w-4' />
                  <span className='sr-only'>Toggle menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start'>
                  {/* Show segments between the first and last in the dropdown */}
                  {segments.slice(1, -1).map((segment, index) => (
                    <DropdownMenuItem key={index}>
                      <Link href={segment.href}>{segment.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {/* Always show the last segment */}
            <BreadcrumbItem>
              <BreadcrumbPage>
                {segments[segments.length - 1].label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          // If within the threshold, show all segments
          segments.slice(1).map((segment, index) => {
            const isLast = index === segments.length - 2; // Last segment (excluding "Home")
            return (
              <div key={segment.href} className='flex items-center'>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={segment.href}>
                      {segment.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </div>
            );
          })
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
