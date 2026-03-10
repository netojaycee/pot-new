"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Search, Loader2 } from "lucide-react";

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  type: "product";
  price?: number;
}

interface SearchResultsDropdownProps {
  results?: SearchProduct[];
  isLoading: boolean;
  query: string;
  onResultClick?: () => void;
}

export function SearchResultsDropdown({
  results,
  isLoading,
  query,
  onResultClick,
}: SearchResultsDropdownProps) {
  const router = useRouter();

  const handleProductClick = useCallback(
    (productSlug: string, productType: string) => {
      // console.log("✓ Product clicked:", productSlug);
      // console.log("✓ Navigating to /products/" + productType + "/" + productSlug);
      onResultClick?.();
      router.push(`/products/${productType}/${productSlug}`);
    },
    [router, onResultClick],
  );

  const handleViewAll = useCallback(() => {
    console.log("✓ View all clicked, query:", query);
    console.log("✓ Navigating to /products?search=" + query);
    onResultClick?.();
    router.push(`/products?search=${encodeURIComponent(query)}`);
  }, [query, router, onResultClick]);

  if (!query || query.trim().length < 2) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 p-4 text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Searching...</span>
        </div>
      )}

      {/* No Results */}
      {!isLoading && !results?.length && (
        <div className="p-4 text-center text-gray-500 text-sm">
          No results found for &quot;{query}&quot;
        </div>
      )}

      {/* Products Section */}
      {!isLoading && results && results.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 sticky top-0">
            <p className="text-xs font-semibold text-gray-600 uppercase">
              Products
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {results.map((product) => {
              return (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product.slug, product.type)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                >
                  <Search size={16} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate group-hover:text-primary">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Product</p>
                      {product.price && (
                        <>
                          <span className="text-gray-300">•</span>
                          <p className="text-xs text-gray-500">
                            £{product.price.toFixed(2)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* View All Results Link */}
      {!isLoading && results?.length ? (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <button
            onClick={handleViewAll}
            className="w-full text-sm text-primary font-medium hover:underline py-1"
          >
            View all results for &quot;{query}&quot;
          </button>
        </div>
      ) : null}
    </div>
  );
}
