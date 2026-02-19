import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";
import { Prisma } from "@prisma/generated/client";
import { generateSlug } from "@/lib/utils";

// ============ TYPES ============

export type AdminServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// ============ VALIDATION SCHEMAS ============

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name required").max(200),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  availableQuantity: z.number().int().min(0),
  categoryId: z.string().min(1, "Category ID required"),
  type: z.enum(["item", "food", "giftbox"]),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name required").max(100),
  description: z.string().optional(),
  type: z.enum(["item", "food", "giftbox"]),
  parentCategoryId: z.string().optional(),
  icon: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ============ PRODUCT ADMIN OPERATIONS ============

/**
 * Create new product
 */
export async function createProduct(
  data: CreateProductInput,
): Promise<AdminServiceResult<any>> {
  try {
    const validated = createProductSchema.parse(data);

    const product = await prisma.product.create({
      data: {
        name: validated.name,
        description: validated.description || "",
        slug: generateSlug(validated.name),
        price: validated.price,
        availableQuantity: validated.availableQuantity,
        categoryId: validated.categoryId,
        type: validated.type,
        images: validated.images || [],
        tags: validated.tags || [],
        avgRating: 0,
        reviewCount: 0,
      },
      include: { category: true, reviews: true },
    });

    // Invalidate product cache
    await redis.del("products");
    if (validated.categoryId) {
      await redis.del("categories");
    }

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
}

/**
 * Update product
 */
export async function updateProduct(
  productId: string,
  data: UpdateProductInput,
): Promise<AdminServiceResult<any>> {
  try {
    const validated = updateProductSchema.parse(data);

    const product = await prisma.product.update({
      where: { id: productId },
      data: validated,
      include: { category: true, reviews: true },
    });

    // Invalidate caches
    await redis.del(`product:${productId}`);
    await redis.del("products");
    if (data.categoryId) {
      await redis.del("categories");
    }

    return { success: true, data: product };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Product not found",
          code: "NOT_FOUND",
        };
      }
    }
    console.error("Update product error:", error);
    return {
      success: false,
      error: "Failed to update product",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Delete product
 */
export async function deleteProduct(
  productId: string,
): Promise<AdminServiceResult<void>> {
  try {
    // Check if product has orders
    const orderCount = await prisma.orderItem.count({
      where: { productId },
    });

    if (orderCount > 0) {
      return {
        success: false,
        error: "Cannot delete product with existing orders. Disable instead.",
        code: "HAS_ORDERS",
      };
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    // Invalidate caches
    await redis.del(`product:${productId}`);
    await redis.del("products");

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Product not found",
          code: "NOT_FOUND",
        };
      }
    }
    console.error("Delete product error:", error);
    return {
      success: false,
      error: "Failed to delete product",
      code: "DELETE_ERROR",
    };
  }
}

/**
 * Disable/Enable product (soft delete)
 */
export async function toggleProductStatus(
  productId: string,
  isActive: boolean,
): Promise<AdminServiceResult<any>> {
  try {
    // const product = await prisma.product.update({
    //   where: { id: productId },
    //   data: { isActive },
    //   include: { category: true },
    // });

    // await redis.del(`product:${productId}`);
    // await redis.del("products");

    return { success: true, data: null };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Product not found",
          code: "NOT_FOUND",
        };
      }
    }
    console.error("Toggle product status error:", error);
    return {
      success: false,
      error: "Failed to update product status",
      code: "UPDATE_ERROR",
    };
  }
}

// ============ CATEGORY ADMIN OPERATIONS ============

/**
 * Create category
 */
export async function createCategory(
  data: CreateCategoryInput,
): Promise<AdminServiceResult<any>> {
  try {
    const validated = createCategorySchema.parse(data);

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        description: validated.description || "",
        type: validated.type,
        parentId: validated.parentCategoryId,
        slug: generateSlug(validated.name),
        // icon: validated.icon,
      },
      include: {
        parent: true,
        children: true,
        products: true,
      },
    });

    // Invalidate cache
    await redis.del("categories");

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
}

/**
 * Update category
 */
export async function updateCategory(
  categoryId: string,
  data: UpdateCategoryInput,
): Promise<AdminServiceResult<any>> {
  try {
    const validated = updateCategorySchema.parse(data);

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: validated,
      include: {
        parent: true,
        children: true,
        products: true,
      },
    });

    // Invalidate cache
    await redis.del("categories");

    return { success: true, data: category };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Category not found",
          code: "NOT_FOUND",
        };
      }
    }
    console.error("Update category error:", error);
    return {
      success: false,
      error: "Failed to update category",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Delete category (only if no products)
 */
export async function deleteCategory(
  categoryId: string,
): Promise<AdminServiceResult<void>> {
  try {
    // Check if category has products or child categories
    const productCount = await prisma.product.count({
      where: { categoryId },
    });

    const childCount = await prisma.category.count({
      where: { parentId: categoryId },
    });

    if (productCount > 0 || childCount > 0) {
      return {
        success: false,
        error:
          "Cannot delete category with products or child categories. Remove them first.",
        code: "HAS_CHILDREN",
      };
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    // Invalidate cache
    await redis.del("categories");

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Category not found",
          code: "NOT_FOUND",
        };
      }
    }
    console.error("Delete category error:", error);
    return {
      success: false,
      error: "Failed to delete category",
      code: "DELETE_ERROR",
    };
  }
}

// ============ BATCH OPERATIONS ============

/**
 * Bulk update stock for multiple products
 */
export async function bulkUpdateStock(
  updates: Array<{ productId: string; stock: number }>,
): Promise<AdminServiceResult<any[]>> {
  try {
    const results = await Promise.all(
      updates.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { availableQuantity: item.stock },
        }),
      ),
    );

    // Invalidate all product caches
    await redis.del("products");
    for (const item of updates) {
      await redis.del(`product:${item.productId}`);
    }

    return { success: true, data: results };
  } catch (error) {
    console.error("Bulk update stock error:", error);
    return {
      success: false,
      error: "Failed to update stock",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Bulk update prices for multiple products
 */
export async function bulkUpdatePrices(
  updates: Array<{ productId: string; price: number }>,
): Promise<AdminServiceResult<any[]>> {
  try {
    const results = await Promise.all(
      updates.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { price: item.price },
        }),
      ),
    );

    // Invalidate all product caches
    await redis.del("products");
    for (const item of updates) {
      await redis.del(`product:${item.productId}`);
    }

    return { success: true, data: results };
  } catch (error) {
    console.error("Bulk update prices error:", error);
    return {
      success: false,
      error: "Failed to update prices",
      code: "UPDATE_ERROR",
    };
  }
}
