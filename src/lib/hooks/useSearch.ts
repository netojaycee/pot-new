import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { searchCategoriesAndProductsAction, type SearchResult } from "@/lib/actions/search.actions";

/**
 * Custom hook for searching categories and products with debouncing
 * @param query - The search query string
 * @param debounceMs - Debounce delay in milliseconds (default: 300ms)
 */
export function useSearch(query: string, debounceMs = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);


  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Fetch search results
  const {
    data: searchResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        return { products: [] };
      }

      const result = await searchCategoriesAndProductsAction(debouncedQuery);

      console.log(result, "search result")
      if (!result.success) {
        throw new Error(result.error || "Search failed");
      }

      return result.data || { products: [] };
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  const hasResults = (searchResult?.products?.length ?? 0) > 0;

  return {
    results: searchResult?.products || [],
    isLoading: isLoading && debouncedQuery.trim().length >= 2,
    error: error as Error | null,
    hasResults,
  };
}
