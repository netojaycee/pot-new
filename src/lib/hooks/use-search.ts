import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchProductsAction,
  getProductsByCategoryAction,
  getPriceRangeAction,
  getFilterCategoriesAction,
} from "@/lib/actions/search.actions";
import { SearchFilters } from "@/lib/services/search.service";

// ============ QUERY KEYS ============

const searchQueryKeys = {
  all: ["search"] as const,
  search: (query: string) => [...searchQueryKeys.all, "search", query] as const,
  category: (categoryId: string) => [
    ...searchQueryKeys.all,
    "category",
    categoryId,
  ] as const,
  priceRange: () => [...searchQueryKeys.all, "price-range"] as const,
  categories: () => [...searchQueryKeys.all, "categories"] as const,
};

// ============ SEARCH HOOKS ============

export function useSearchProducts(query: string, filters?: SearchFilters) {
  return useQuery({
    queryKey: searchQueryKeys.search(query),
    queryFn: async () => {
      const result = await searchProductsAction(query, filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!query && query.length > 0,
  });
}

export function useProductsByCategory(
  categoryId: string,
  filters?: Omit<SearchFilters, "categoryId">
) {
  return useQuery({
    queryKey: searchQueryKeys.category(categoryId),
    queryFn: async () => {
      const result = await getProductsByCategoryAction(categoryId, filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!categoryId,
  });
}

export function usePriceRange() {
  return useQuery({
    queryKey: searchQueryKeys.priceRange(),
    queryFn: async () => {
      const result = await getPriceRangeAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useFilterCategories() {
  return useQuery({
    queryKey: searchQueryKeys.categories(),
    queryFn: async () => {
      const result = await getFilterCategoriesAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}
