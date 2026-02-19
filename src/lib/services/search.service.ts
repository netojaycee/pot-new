import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";

// ============ TYPES ============

export type SearchServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

export interface SearchFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: "price_asc" | "price_desc" | "rating" | "newest" | "popular";
  limit?: number;
  offset?: number;
  type?: "item" | "food" | "giftbox";
}

export interface SearchResult {
  products: any[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============ VALIDATION SCHEMAS ============

const searchFiltersSchema = z.object({
  categoryId: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().positive().optional(),
  minRating: z.number().min(0).max(5).optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "rating", "newest", "popular"])
    .optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  type: z.enum(["item", "food", "giftbox"]).optional(),
});

// ============ SEARCH OPERATIONS ============

/**
 * Search products by name
 */
export async function searchProducts(
  query: string,
  filters?: SearchFilters
): Promise<SearchServiceResult<SearchResult>> {
  try {
    const validated = searchFiltersSchema.parse(filters || {});

    // Build where clause
    const where: any = {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { tags: { hasSome: [query] } },
      ],
    };

    if (validated.categoryId) {
      where.categoryId = validated.categoryId;
    }
    if (validated.minPrice !== undefined) {
      where.price = { gte: validated.minPrice };
    }
    if (validated.maxPrice !== undefined) {
      if (where.price) {
        where.price.lte = validated.maxPrice;
      } else {
        where.price = { lte: validated.maxPrice };
      }
    }
    if (validated.minRating !== undefined) {
      where.rating = { gte: validated.minRating };
    }
    if (validated.type) {
      where.type = validated.type;
    }

    // Determine sort order
    let orderBy: any = { createdAt: "desc" };
    if (validated.sortBy === "price_asc") {
      orderBy = { price: "asc" };
    } else if (validated.sortBy === "price_desc") {
      orderBy = { price: "desc" };
    } else if (validated.sortBy === "rating") {
      orderBy = { rating: "desc" };
    } else if (validated.sortBy === "popular") {
      orderBy = { numberOfReviews: "desc" };
    }

    // Get total count
    const total = await prisma.product.count({ where });

    // Get paginated products
    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: validated.limit,
      skip: validated.offset,
      include: {
        category: true,
        reviews: { take: 1, select: { rating: true } },
      },
    });

    return {
      success: true,
      data: {
        products,
        total,
        limit: validated.limit,
        offset: validated.offset,
        hasMore: validated.offset + validated.limit < total,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }
    console.error("Search products error:", error);
    return {
      success: false,
      error: "Failed to search products",
      code: "SEARCH_ERROR",
    };
  }
}

/**
 * Get products by category with filters
 */
export async function getProductsByCategory(
  categoryId: string,
  filters?: Omit<SearchFilters, "categoryId">
): Promise<SearchServiceResult<SearchResult>> {
  try {
    const validated = searchFiltersSchema.parse({ categoryId, ...filters });

    const where: any = {
      isActive: true,
      categoryId,
    };

    if (validated.minPrice !== undefined) {
      where.price = { gte: validated.minPrice };
    }
    if (validated.maxPrice !== undefined) {
      if (where.price) {
        where.price.lte = validated.maxPrice;
      } else {
        where.price = { lte: validated.maxPrice };
      }
    }
    if (validated.minRating !== undefined) {
      where.rating = { gte: validated.minRating };
    }
    if (validated.type) {
      where.type = validated.type;
    }

    let orderBy: any = { createdAt: "desc" };
    if (validated.sortBy === "price_asc") {
      orderBy = { price: "asc" };
    } else if (validated.sortBy === "price_desc") {
      orderBy = { price: "desc" };
    } else if (validated.sortBy === "rating") {
      orderBy = { rating: "desc" };
    } else if (validated.sortBy === "popular") {
      orderBy = { numberOfReviews: "desc" };
    }

    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: validated.limit,
      skip: validated.offset,
      include: {
        category: true,
        reviews: { take: 1, select: { rating: true } },
      },
    });

    return {
      success: true,
      data: {
        products,
        total,
        limit: validated.limit,
        offset: validated.offset,
        hasMore: validated.offset + validated.limit < total,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }
    console.error("Get products by category error:", error);
    return {
      success: false,
      error: "Failed to fetch products",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get price range for filtering
 */
export async function getPriceRange(): Promise<
  SearchServiceResult<{ min: number; max: number }>
> {
  try {
    const cacheKey = "price_range";
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === "string") {
      return { success: true, data: JSON.parse(cached) };
    }

    const [minProduct, maxProduct] = await Promise.all([
      prisma.product.findFirst({
        where: { availableQuantity: { gt: 0 } },
        orderBy: { price: "asc" },
        select: { price: true },
      }),
      prisma.product.findFirst({
        where: { availableQuantity: { gt: 0 } },
        orderBy: { price: "desc" },
        select: { price: true },
      }),
    ]);

    const priceRange = {
      min: minProduct?.price || 0,
      max: maxProduct?.price || 999999,
    };

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(priceRange));

    return { success: true, data: priceRange };
  } catch (error) {
    console.error("Get price range error:", error);
    return {
      success: false,
      error: "Failed to fetch price range",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get all categories for filtering
 */
export async function getFilterCategories(): Promise<
  SearchServiceResult<any[]>
> {
  try {
    const cacheKey = "filter_categories";
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === "string") {
      return { success: true, data: JSON.parse(cached) };
    }

    const categories = await prisma.category.findMany({
      where: { parentId: null }, // Only top-level categories
      include: {
        children: true,
        _count: { select: { products: true } },
      },
    });

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(categories));

    return { success: true, data: categories };
  } catch (error) {
    console.error("Get filter categories error:", error);
    return {
      success: false,
      error: "Failed to fetch categories",
      code: "FETCH_ERROR",
    };
  }
}
