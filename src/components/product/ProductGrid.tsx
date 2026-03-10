"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductCard } from "./ProductCard";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ProductFilterContent } from "./ProductFilterContent";
import { SortSelect } from "./SortSelect";
import { ProductPagination } from "./ProductPagination";

interface FilterValues {
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

interface ProductGridProps {
  products: any[];
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  baseUrl?: string;
  sortBy?: "newest" | "popular" | "price_asc" | "price_desc" | "rating";
  initialFilters?: FilterValues;
  search?: string;
}

const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: lowest to highest" },
  { value: "price_desc", label: "Price: highest to lowest" },
];

export function ProductGrid({
  products,
  page = 1,
  pageCount = 1,
  baseUrl,
  onPageChange,
  sortBy: initialSortBy = "newest",
  initialFilters = {},
  search,
}: ProductGridProps) {
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);

  const buildUrlWithParams = (newPage?: number, newSort?: string, newFilters?: FilterValues) => {
    const page = newPage || 1;
    const sort = newSort || sortBy;
    const filterObj = newFilters || filters;

    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("sortBy", sort);

    // Add search param if present
    if (search) params.set("search", search);

    // Add filter params
    if (filterObj.minPrice) params.set("minPrice", filterObj.minPrice.toString());
    if (filterObj.maxPrice) params.set("maxPrice", filterObj.maxPrice.toString());
    if (filterObj.minRating) params.set("minRating", filterObj.minRating.toString());

    return `${baseUrl}?${params.toString()}`;
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort as any);
    if (baseUrl) {
      router.push(buildUrlWithParams(1, newSort, filters));
    }
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    if (baseUrl) {
      router.push(buildUrlWithParams(1, sortBy, newFilters));
    }
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">No products found.</div>
    );
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4">
      {/* Desktop Filter Sidebar */}
      <div className="hidden lg:block min-w-65 max-h-fit border rounded-xl bg-card self-start">
        <ProductFilterContent 
          onFilterChange={handleFilterChange}
          initialFilters={initialFilters}
        />
      </div>
      {/* Mobile Filter Button & Drawer */}
      <div className="lg:hidden mb-4 flex justify-between items-center">
        <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" onClick={() => setFilterOpen(true)}>
              &#9881; Filters
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filters</DrawerTitle>
            </DrawerHeader>
            <ProductFilterContent 
              onFilterChange={handleFilterChange}
              initialFilters={initialFilters}
            />
          </DrawerContent>
        </Drawer>
        {/* Sort Select for mobile */}
        <div className="w-40">
          <SortSelect
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={handleSortChange}
          />
        </div>
      </div>
      {/* Products grid and desktop sort */}
      <div className="flex-1">
        <div className="justify-end mb-4 hidden lg:flex">
          <div className="w-40">
            <SortSelect
              value={sortBy}
              options={SORT_OPTIONS}
              onChange={handleSortChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <ProductPagination page={page} pageCount={pageCount} baseUrl={baseUrl} onPageChange={onPageChange} sortBy={sortBy} />
      </div>
    </div>
  );
}
