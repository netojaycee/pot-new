"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "../ui/button";

interface FilterValues {
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

interface ProductFilterContentProps {
  onFilterChange?: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}



export function ProductFilterContent({ 
  onFilterChange, 
  initialFilters = {} 
}: ProductFilterContentProps) {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);

  const handlePriceChange = (type: "min" | "max", value: number) => {
    const newFilters = { ...filters };
    if (type === "min") newFilters.minPrice = value || undefined;
    if (type === "max") newFilters.maxPrice = value || undefined;
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleRatingChange = (rating: number) => {
    const newFilters = { ...filters, minRating: rating };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    onFilterChange?.({});
  };

  return (
    <div className="p-4 min-w-55">
      <h2 className="font-semibold mb-4">Filters</h2>

      <Accordion type="multiple" defaultValue={["price", "rating"]} className="space-y-0">
        {/* Price Filter */}
        <AccordionItem value="price" className="border-b">
          <AccordionTrigger className="py-3">Price</AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500">Min</label>
                <input
                  type="number"
                  value={filters.minPrice || ""}
                  onChange={e => handlePriceChange("min", Number(e.target.value) || 0)}
                  placeholder="$0"
                  className="w-full border rounded px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Max</label>
                <input
                  type="number"
                  value={filters.maxPrice || ""}
                  onChange={e => handlePriceChange("max", Number(e.target.value) || 0)}
                  placeholder="$1000"
                  className="w-full border rounded px-2 py-1 text-xs"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Rating Filter */}
        <AccordionItem value="rating" className="border-b">
          <AccordionTrigger className="py-3">Min Rating</AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => (
                <label key={rating} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.minRating === rating}
                    onChange={() => handleRatingChange(rating)}
                  />
                  {"★".repeat(rating)} {rating}+
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {Object.keys(filters).some(key => filters[key as keyof FilterValues]) && (
        <Button
          onClick={handleReset}
          className="w-full text-sm "
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}
