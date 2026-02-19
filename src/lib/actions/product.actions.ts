"use server";

import { getSession } from "@/lib/auth";
import {
  productService,
  CreateProductInput,
  UpdateProductInput,
  createProductSchema,
  updateProductSchema,
} from "@/lib/services/product.service";
import { revalidatePath } from "next/cache";

// ============ USER READ ACTIONS ============

/**
 * Get all products with filters
 */
export async function getProductsAction(filters?: {
  categoryId?: string;
  type?: "item" | "food" | "giftbox";
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "newest" | "popular" | "price_asc" | "price_desc" | "rating";
}) {
  try {
    const products = await productService.getProducts(filters);
    return { success: true, data: products };
  } catch (error) {
    console.error("Get products error:", error);
    return { success: false, error: "Failed to fetch products" };
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

    // TODO: Add role check when user service is ready
    // const user = await getUser(session.userId);
    // if (user?.role !== "admin") {
    //   return { success: false, error: "Admin access required", code: "FORBIDDEN" };
    // }

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

    // TODO: Add role check
    // const user = await getUser(session.userId);
    // if (user?.role !== "admin") {
    //   return { success: false, error: "Admin access required", code: "FORBIDDEN" };
    // }

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
      revalidatePath(`/product/${id}`);
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

    // TODO: Add role check
    // const user = await getUser(session.userId);
    // if (user?.role !== "admin") {
    //   return { success: false, error: "Admin access required", code: "FORBIDDEN" };
    // }

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

    // TODO: Add role check
    // const user = await getUser(session.userId);
    // if (user?.role !== "admin") {
    //   return { success: false, error: "Admin access required", code: "FORBIDDEN" };
    // }

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
