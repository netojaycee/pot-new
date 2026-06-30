"use server";

import { getSession } from "@/lib/auth";
import {
  productService,
  CreateProductInput,
  UpdateProductInput,
  createProductSchema,
  updateProductSchema,
} from "@/lib/services/product.service";
import { cloudinaryService } from "@/lib/services/cloudinary.service";
import { revalidatePath } from "next/cache";

// ============ USER READ ACTIONS ============

/**
 * Get all products with filters
 */
export async function getProductsAction(filters?: {
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
}) {
  try {
    const result = await productService.getProducts(filters);
    return { success: true, data: result.data, total: result.total };
  } catch (error) {
    console.error("Get products error:", error);
    return { success: false, error: "Failed to fetch products", total: 0 };
  }
}

/**
 * Get single product by ID or slug
 */
export async function getProductAction(identifier: string) {
  try {
    if (!identifier || identifier.trim() === "") {
      return { success: false, error: "Product identifier required" };
    }

    const product = await productService.getProductByIdentifier(identifier);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    return { success: true, data: product };
  } catch (error) {
    console.error("Get product error:", error);
    return { success: false, error: "Failed to fetch product" };
  }
}

/**
 * Search products
 */
export async function searchProductsAction(query: string, limit = 20) {
  try {
    if (!query || query.trim() === "") {
      return { success: true, data: [] };
    }

    const results = await productService.searchProducts(query, limit);
    return { success: true, data: results };
  } catch (error) {
    console.error("Search products error:", error);
    return { success: false, error: "Failed to search products" };
  }
}

/**
 * Get related products from same category
 */
export async function getRelatedProductsAction(productId: string, categoryId: string, limit = 4) {
  try {
    if (!productId || !categoryId) {
      return { success: false, error: "Product ID and Category ID required" };
    }

    const products = await productService.getRelatedProducts(productId, categoryId, limit);
    return { success: true, data: products };
  } catch (error) {
    console.error("Get related products error:", error);
    return { success: false, error: "Failed to fetch related products" };
  }
}

// ============ ADMIN WRITE ACTIONS ============

/**
 * Create a new product (admin only)
 */
export async function createProductAction(input: CreateProductInput) {
  try {
    // Check authentication and role
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
    if (!user || user.role !== "admin") {
      return { success: false, error: "Forbidden: admin access required", code: "FORBIDDEN" };
    }

    // Validate input
    const validated = createProductSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }

    // Create product
    const result = await productService.createProduct(validated.data);

    if (result.success) {
      // Revalidate product pages
      revalidatePath("/admin/products");
      revalidatePath("/products");
    }

    return result;
  } catch (error) {
    console.error("Create product action error:", error);
    return {
      success: false,
      error: "Failed to create product",
      code: "CREATE_ERROR",
    };
  }
}

/**
 * Update a product (admin only)
 */
export async function updateProductAction(id: string, input: UpdateProductInput) {
  try {
    // Check authentication and role
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
    if (!user || user.role !== "admin") {
      return { success: false, error: "Forbidden: admin access required", code: "FORBIDDEN" };
    }

    if (!id || id.trim() === "") {
      return {
        success: false,
        error: "Product ID required",
        code: "INVALID_ID",
      };
    }

    // Validate input
    const validated = updateProductSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }

    // Update product
    const result = await productService.updateProduct(id, validated.data);

    if (result.success) {
      // Revalidate affected paths
      revalidatePath("/admin/products");
      revalidatePath("/products");
      revalidatePath(`/products/${id}`);
    }

    return result;
  } catch (error) {
    console.error("Update product action error:", error);
    return {
      success: false,
      error: "Failed to update product",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Delete a product (admin only)
 */
export async function deleteProductAction(id: string) {
  try {
    // Check authentication and role
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
    if (!user || user.role !== "admin") {
      return { success: false, error: "Forbidden: admin access required", code: "FORBIDDEN" };
    }

    if (!id || id.trim() === "") {
      return {
        success: false,
        error: "Product ID required",
        code: "INVALID_ID",
      };
    }

    const result = await productService.deleteProduct(id);

    if (result.success) {
      // Revalidate affected paths
      revalidatePath("/admin/products");
      revalidatePath("/products");
    }

    return result;
  } catch (error) {
    console.error("Delete product action error:", error);
    return {
      success: false,
      error: "Failed to delete product",
      code: "DELETE_ERROR",
    };
  }
}

/**
 * Update product stock (admin only)
 */
export async function updateProductStockAction(
  productId: string,
  quantity: number
) {
  try {
    // Check authentication and role
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
    if (!user || user.role !== "admin") {
      return { success: false, error: "Forbidden: admin access required", code: "FORBIDDEN" };
    }

    if (!productId || productId.trim() === "") {
      return {
        success: false,
        error: "Product ID required",
        code: "INVALID_ID",
      };
    }

    if (typeof quantity !== "number" || quantity < 0) {
      return {
        success: false,
        error: "Quantity must be a non-negative number",
        code: "INVALID_QUANTITY",
      };
    }

    const result = await productService.updateStock(productId, quantity);

    if (result.success) {
      revalidatePath("/admin/products");
      revalidatePath("/products");
    }

    return result;
  } catch (error) {
    console.error("Update stock action error:", error);
    return {
      success: false,
      error: "Failed to update stock",
      code: "UPDATE_ERROR",
    };
  }
}

export async function uploadProductImageAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) return { success: false, error: "Unauthorized" };
    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
    if (!user || user.role !== "admin") return { success: false, error: "Forbidden" };
    const file = formData.get("file") as File;
    if (!file || !(file instanceof File)) return { success: false, error: "No file provided" };
    const result = await cloudinaryService.uploadImage(file, "pot/products");
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: { url: result.data.secureUrl, pubId: result.data.pubId } };
  } catch (error) {
    console.error("Upload product image error:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

export async function deleteProductImageAction(pubId: string) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) return { success: false, error: "Unauthorized" };
    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
    if (!user || user.role !== "admin") return { success: false, error: "Forbidden" };
    const result = await cloudinaryService.deleteImage(pubId);
    return result.success ? { success: true } : { success: false, error: result.error };
  } catch (error) {
    console.error("Delete product image error:", error);
    return { success: false, error: "Failed to delete image" };
  }
}
