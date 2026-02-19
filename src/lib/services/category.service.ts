import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";

const CACHE_TTL = 3600; // 1 hour

// Types
export type CategoryResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// Validation Schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name required"),
  description: z.string().optional(),
  slug: z.string().min(1, "Slug required"),
  type: z.enum(["item", "food", "giftbox"]).default("item"),
  parentId: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// Helper: Invalidate category cache
async function invalidateCategoryCache(categoryId?: string) {
  try {
    if (categoryId) {
      await redis.del(`category:${categoryId}`);
    }
    // Invalidate all category list caches
    const keys = await redis.keys("categories:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Redis cache invalidation error:", error);
  }
}

export const categoryService = {
  // ============ READ OPERATIONS ============

  /**
   * Get all categories with hierarchy
   */
  async getAllCategories(filters?: { type?: "item" | "food" | "giftbox" }): Promise<any[]> {
    const cacheKey = `categories:all:${filters?.type || "all"}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached as any[];
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const where = filters?.type ? { type: filters.type } : {};

    const categories = await prisma.category.findMany({
      where,
      include: {
        children: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });

    try {
      await redis.set(cacheKey, categories, { ex: CACHE_TTL });
    } catch (error) {
      console.error("Redis set error:", error);
    }

    return categories;
  },

  /**
   * Get single category by ID or slug
   */
  async getCategoryByIdentifier(identifier: string): Promise<any | null> {
    const cacheKey = `category:${identifier}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached as any;
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const category = await prisma.category.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        parent: true,
        children: true,
        products: { select: { id: true, name: true, price: true } },
        _count: { select: { products: true } },
      },
    });

    if (category) {
      try {
        await redis.set(cacheKey, category, { ex: CACHE_TTL });
      } catch (error) {
        console.error("Redis set error:", error);
      }
    }

    return category;
  },

  /**
   * Get root categories (no parent)
   */
  async getRootCategories(type?: "item" | "food" | "giftbox"): Promise<any[]> {
    const where = {
      parentId: null,
      ...(type && { type }),
    };

    return prisma.category.findMany({
      where,
      include: { children: true, _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
  },

  // ============ ADMIN WRITE OPERATIONS ============

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryInput): Promise<CategoryResult<any>> {
    try {
      const validated = createCategorySchema.parse(data);

      // Check if slug exists
      const existing = await prisma.category.findUnique({ where: { slug: validated.slug } });
      if (existing) {
        return { success: false, error: "Category with this slug already exists", code: "CATEGORY_EXISTS" };
      }

      const category = await prisma.category.create({
        data: validated,
        include: { parent: true, children: true },
      });

      await invalidateCategoryCache();

      return { success: true, data: category };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Create category error:", error);
      return {
        success: false,
        error: "Failed to create category",
        code: "CREATE_ERROR",
      };
    }
  },

  /**
   * Update a category
   */
  async updateCategory(id: string, data: UpdateCategoryInput): Promise<CategoryResult<any>> {
    try {
      const validated = updateCategorySchema.parse(data);

      const category = await prisma.category.update({
        where: { id },
        data: validated,
        include: { parent: true, children: true },
      });

      await invalidateCategoryCache(id);

      return { success: true, data: category };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Update category error:", error);
      return {
        success: false,
        error: "Failed to update category",
        code: "UPDATE_ERROR",
      };
    }
  },

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<CategoryResult<any>> {
    try {
      const category = await prisma.category.delete({
        where: { id },
      });

      await invalidateCategoryCache(id);

      return { success: true, data: category };
    } catch (error) {
      console.error("Delete category error:", error);
      return {
        success: false,
        error: "Failed to delete category",
        code: "DELETE_ERROR",
      };
    }
  },
};
