import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";

const CACHE_TTL = 3600; // 1 hour

// Types
export type ProductResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// Validation Schemas
export const createProductSchema = z.object({
  name: z.string().min(1, "Product name required"),
  description: z.string().min(1, "Description required"),
  price: z.number().positive("Price must be positive"),
  availableQuantity: z.number().int().nonnegative(),
  categoryId: z.string().min(1, "Category required"),
  images: z.array(z.string().url()).min(1, "At least one image required"),
  type: z.enum(["item", "food", "giftbox"]).default("item"),
  discountPercentage: z.number().nonnegative().optional(),
  discountExpiry: z.date().optional(),
  tags: z.array(z.string()).default([]),
  whatIncluded: z.array(z.string()).optional(),
  perfectFor: z.array(z.string()).optional(),
  whyChoose: z.array(z.string()).optional(),
  deliveryInfo: z
    .object({
      title: z.string().min(1, "Delivery title required"),
      details: z.array(z.string()).min(1, "At least one detail required"),
    })
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Helper: Invalidate product cache
async function invalidateProductCache(productId?: string) {
  try {
    if (productId) {
      await redis.del(`product:${productId}`);
    }
    // Invalidate all product list caches
    const keys = await redis.keys("products:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Redis cache invalidation error:", error);
  }
}

export const productService = {
  // ============ READ OPERATIONS ============

  /**
   * Get all products with optional filters
   */
  async getProducts(filters?: {
    categoryId?: string;
    category?: string;
    type?: "item" | "food" | "giftbox";
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    limit?: number;
    offset?: number;
    sortBy?: "newest" | "popular" | "price_asc" | "price_desc" | "rating";
  }): Promise<any> {
    const {
      category,
      type,
      search,
      minPrice,
      maxPrice,
      minRating,
      limit = 20,
      offset = 0,
      sortBy = "newest",
    } = filters || {};
    let { categoryId } = filters || {};
    // If category slug is provided, fetch the category to get its ID
    if (category && !categoryId) {
      const cat = await prisma.category.findUnique({
        where: { slug: category },
      });
      if (cat) categoryId = cat.id;
    }

    // Generate cache key based on filters
    const cacheKey = `products:list:${JSON.stringify({ categoryId, type, search, minPrice, maxPrice, minRating, limit, offset, sortBy })}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached as { data: any[]; total: number };
    } catch (error) {
      console.error("Redis get error:", error);
    }

    // Build where clause
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type;
    if (minPrice !== undefined) where.price = { ...where.price, gte: minPrice };
    if (maxPrice !== undefined) where.price = { ...where.price, lte: maxPrice };
    if (minRating !== undefined) where.avgRating = { gte: minRating };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Build orderBy
    const orderByMap: Record<string, any> = {
      newest: { createdAt: "desc" },
      popular: { soldCount: "desc" },
      price_asc: { price: "asc" },
      price_desc: { price: "desc" },
      rating: { avgRating: "desc" },
    };

    // Get total count
    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      include: { category: true, _count: { select: { reviews: true } } },
      orderBy: orderByMap[sortBy],
      take: limit,
      skip: offset,
    });

    const result = { data: products, total };

    // Cache
    try {
      await redis.set(cacheKey, result, { ex: CACHE_TTL });
    } catch (error) {
      console.error("Redis set error:", error);
    }

    return result;
  },

  /**
   * Get single product by ID or slug
   */
  async getProductByIdentifier(identifier: string): Promise<any | null> {
    const cacheKey = `product:${identifier}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        category: true,
        reviews: {
          select: {
            id: true,
            rating: true,
            message: true,
            user: { select: { firstName: true, image: true } },
          },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (product) {
      try {
        await redis.set(cacheKey, product, { ex: CACHE_TTL });
      } catch (error) {
        console.error("Redis set error:", error);
      }
    }

    return product;
  },

  /**
   * Get products by category with caching
   */
  async getProductsByCategory(categoryId: string, limit = 10): Promise<any[]> {
    return this.getProducts({ categoryId, limit });
  },

  /**
   * Get related products from same category (excludes current product)
   */
  async getRelatedProducts(
    productId: string,
    categoryId: string,
    limit = 4,
  ): Promise<any[]> {
    const cacheKey = `products:related:${productId}:${categoryId}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached as any[];
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const products = await prisma.product.findMany({
      where: {
        categoryId,
        id: { not: productId }, // Exclude current product
      },
      include: { category: true, _count: { select: { reviews: true } } },
      orderBy: { soldCount: "desc" },
      take: limit,
    });

    try {
      await redis.set(cacheKey, products, { ex: CACHE_TTL });
    } catch (error) {
      console.error("Redis set error:", error);
    }

    return products;
  },

  /**
   * Search products
   */
  async searchProducts(query: string, limit = 20): Promise<any[]> {
    return this.getProducts({ search: query, limit });
  },

  // ============ ADMIN WRITE OPERATIONS ============

  /**
   * Create a new product
   */
  async createProduct(data: CreateProductInput): Promise<ProductResult<any>> {
    try {
      // Validate input
      const validated = createProductSchema.parse(data);

      // Check if slug exists (auto-generated from name)
      const slug = validated.name.toLowerCase().replace(/\s+/g, "-");
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) {
        return {
          success: false,
          error: "Product with this name already exists",
          code: "PRODUCT_EXISTS",
        };
      }

      const product = await prisma.product.create({
        data: {
          ...validated,
          slug,
        },
        include: { category: true },
      });

      // Invalidate caches
      await invalidateProductCache();

      return { success: true, data: product };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Create product error:", error);
      return {
        success: false,
        error: "Failed to create product",
        code: "CREATE_ERROR",
      };
    }
  },

  /**
   * Update an existing product
   */
  async updateProduct(
    id: string,
    data: UpdateProductInput,
  ): Promise<ProductResult<any>> {
    try {
      const validated = updateProductSchema.parse(data);

      const product = await prisma.product.update({
        where: { id },
        data: validated,
        include: { category: true },
      });

      // Invalidate caches
      await invalidateProductCache(id);

      return { success: true, data: product };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Update product error:", error);
      return {
        success: false,
        error: "Failed to update product",
        code: "UPDATE_ERROR",
      };
    }
  },

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<ProductResult<any>> {
    try {
      const product = await prisma.product.delete({
        where: { id },
      });

      // Invalidate caches
      await invalidateProductCache(id);

      return { success: true, data: product };
    } catch (error) {
      console.error("Delete product error:", error);
      return {
        success: false,
        error: "Failed to delete product",
        code: "DELETE_ERROR",
      };
    }
  },

  /**
   * Update product stock
   */
  async updateStock(id: string, quantity: number): Promise<ProductResult<any>> {
    try {
      if (quantity < 0) {
        return {
          success: false,
          error: "Quantity cannot be negative",
          code: "INVALID_QUANTITY",
        };
      }

      const product = await prisma.product.update({
        where: { id },
        data: { availableQuantity: quantity },
        include: { category: true },
      });

      await invalidateProductCache(id);

      return { success: true, data: product };
    } catch (error) {
      console.error("Update stock error:", error);
      return {
        success: false,
        error: "Failed to update stock",
        code: "STOCK_UPDATE_ERROR",
      };
    }
  },
};
