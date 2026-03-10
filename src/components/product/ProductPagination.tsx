"use client";

import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface ProductPaginationProps {
  page: number;
  pageCount: number;
  baseUrl?: string;
  onPageChange?: (page: number) => void;
  sortBy?: string;
}

export function ProductPagination({ page, pageCount, baseUrl, onPageChange, sortBy }: ProductPaginationProps) {
  const router = useRouter();

  const handlePageChange = (newPage: number) => {
    if (baseUrl) {
      // Navigate using URL with searchParams, preserve sortBy if provided
      const params = new URLSearchParams();
      params.set("page", newPage.toString());
      if (sortBy) {
        params.set("sortBy", sortBy);
      }
      router.push(`${baseUrl}?${params.toString()}`);
    } else if (onPageChange) {
      // Fallback to callback
      onPageChange(newPage);
    }
  };

  return (
    <Pagination className="py-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={e => {
              e.preventDefault();
              if (page > 1) handlePageChange(page - 1);
            }}
            className={page === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        {Array.from({ length: Math.min(pageCount, 4) }, (_, i) => (
          <PaginationItem key={i + 1}>
            <PaginationLink
              href="#"
              isActive={page === i + 1}
              onClick={e => {
                e.preventDefault();
                handlePageChange(i + 1);
              }}
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        {pageCount > 4 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {pageCount > 4 && (
          <PaginationItem>
            <PaginationLink
              href="#"
              isActive={page === pageCount}
              onClick={e => {
                e.preventDefault();
                handlePageChange(pageCount);
              }}
            >
              {pageCount}
            </PaginationLink>
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={e => {
              e.preventDefault();
              if (page < pageCount) handlePageChange(page + 1);
            }}
            className={page === pageCount ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
