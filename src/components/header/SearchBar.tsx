"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useSearch } from "@/lib/hooks/useSearch";
import { SearchResultsDropdown } from "./SearchResultsDropdown";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, isLoading } = useSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside (but allow clicks inside dropdown)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex-1 relative">
      <div className="relative">
        <Input
          ref={inputRef}
          className="pl-8 w-full font-normal placeholder:text-muted-foreground text-sm"
          placeholder="search for anything..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query && setIsOpen(true)}
        />
        <Search className="absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div ref={dropdownRef}>
          <SearchResultsDropdown
            results={results}
            isLoading={isLoading}
            query={query}
            onResultClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
