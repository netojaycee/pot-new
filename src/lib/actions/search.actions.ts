"use server";

import {
  searchProducts,
  getProductsByCategory,
  getPriceRange,
  getFilterCategories,
  SearchFilters,
} from "@/lib/services/search.service";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

// ============ SEARCH ACTIONS ============

export async function searchProductsAction(
  query: string,
  filters?: SearchFilters,
) {
  return await searchProducts(query, filters);
}

export async function getProductsByCategoryAction(
  categoryId: string,
  filters?: Omit<SearchFilters, "categoryId">,
) {
  return await getProductsByCategory(categoryId, filters);
}

export async function getPriceRangeAction() {
  return await getPriceRange();
}

export async function getFilterCategoriesAction() {
  return await getFilterCategories();
}

// ============ UNIFIED SEARCH (CATEGORIES + PRODUCTS) ============

export interface SearchResult {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    type: "product";
    basePrice?: number;
  }>;
}

const CACHE_TTL = 3600; // 1 hour

/**
 * Search for categories and products by query
 */
export async function searchCategoriesAndProductsAction(
  query: string,
): Promise<{
  success: boolean;
  data?: SearchResult;
  error?: string;
}> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: { products: [] } };
    }

    const normalizedQuery = query.trim().toLowerCase();
    console.log(normalizedQuery, "normalized query");

    // Try cache first
    const cacheKey = `search:${normalizedQuery}`;
    try {
      const cachedResult = await redis.get(cacheKey);

      if (cachedResult) {
        console.log("Returning cached result");
        return {
          success: true,
          data: JSON.parse(cachedResult as string),
        };
      }
    } catch (cacheError) {
      console.warn("Cache read error (continuing):", cacheError);
    }

    // Search products
    console.log("Searching products...");
    const products = await prisma.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            slug: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
      },
      take: 5,
    });
    console.log("Products found:", products.length);

    const result: SearchResult = {
      products: products.map((prod: any) => ({
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        type: "product" as const,
        basePrice: prod.basePrice,
      })),
    };

    // Cache the result
    try {
      await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TTL });
      console.log("Result cached");
    } catch (cacheError) {
      console.warn("Cache write error (search still successful):", cacheError);
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Search action error - Full error:", error);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : "Unknown error",
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack",
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search",
    };
  }
}
