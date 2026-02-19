"use server";

import { revalidatePath } from "next/cache";
import {
  searchProducts,
  getProductsByCategory,
  getPriceRange,
  getFilterCategories,
  SearchFilters,
} from "@/lib/services/search.service";

// ============ SEARCH ACTIONS ============

export async function searchProductsAction(
  query: string,
  filters?: SearchFilters
) {
  return await searchProducts(query, filters);
}

export async function getProductsByCategoryAction(
  categoryId: string,
  filters?: Omit<SearchFilters, "categoryId">
) {
  return await getProductsByCategory(categoryId, filters);
}

export async function getPriceRangeAction() {
  return await getPriceRange();
}

export async function getFilterCategoriesAction() {
  return await getFilterCategories();
}
