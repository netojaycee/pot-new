"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkUpdateStock,
  bulkUpdatePrices,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/services/admin.service";

// ============ AUTH GUARD ============

async function requireAdmin() {
  const session = await getSession();
  if (!session || !("userId" in session)) {
    return null;
  }

  // TODO: Verify user.role === "ADMIN" from database
  // For now, we'll assume the action checks this in the service layer
  return session.userId;
}

// ============ PRODUCT ACTIONS ============

export async function createProductAction(input: CreateProductInput) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return {
      success: false,
      error: "Unauthorized: Admin access required",
      code: "UNAUTHORIZED",
    };
  }

  const result = await createProduct(input);
  if (result.success) {
    revalidatePath("/admin/products");
    revalidatePath("/products");
  }
  return result;
}

export async function updateProductAction(
  productId: string,
  input: UpdateProductInput
) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return {
      success: false,
      error: "Unauthorized: Admin access required",
      code: "UNAUTHORIZED",
    };
  }

  const result = await updateProduct(productId, input);
  if (result.success) {
    revalidatePath("/admin/products");
    revalidatePath(`/product/${productId}`);
    revalidatePath("/products");
  }
  return result;
}

export async function deleteProductAction(productId: string) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return {
      success: false,
      error: "Unauthorized: Admin access required",
      code: "UNAUTHORIZED",
    };
  }

  const result = await deleteProduct(productId);
  if (result.success) {
    revalidatePath("/admin/products");
    revalidatePath("/products");
  }
  return result;
}

export async function toggleProductStatusAction(
  productId: string,
  isActive: boolean
) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return {
      success: false,
      error: "Unauthorized: Admin access required",
      code: "UNAUTHORIZED",
    };
  }

  const result = await toggleProductStatus(productId, isActive);
  if (result.success) {
    revalidatePath("/admin/products");
    revalidatePath("/products");
  }
  return result;
}

// ============ CATEGORY ACTIONS ============

export async function createCategoryAction(input: CreateCategoryInput) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return {
      success: false,
      error: "Unauthorized: Admin access required",
      code: "UNAUTHORIZED",
    };
  }

  const result = await createCategory(input);
  if (result.success) {
    revalidatePath("/admin/categories");
    revalidatePath("/");
  }
  return result;
}

export async function updateCategoryAction(
  categoryId: string,
  input: UpdateCategoryInput
) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return {
      success: false,
      error: "Unauthorized: Admin access required",
      code: "UNAUTHORIZED",
    };
  }

  const result = await updateCategory(categoryId, input);
  if (result.success) {
    revalidatePath("/admin/categories");
    revalidatePath("/");
  }
  return result;
}

export async function deleteCategoryAction(categoryId: string) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return {
      success: false,
      error: "Unauthorized: Admin access required",
      code: "UNAUTHORIZED",
    };
  }

  const result = await deleteCategory(categoryId);
  if (result.success) {
    revalidatePath("/admin/categories");
    revalidatePath("/");
  }
  return result;
}

// ============ BULK ACTIONS ============

export async function bulkUpdateStockAction(
  updates: Array<{ productId: string; stock: number }>
) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return {
      success: false,
      error: "Unauthorized: Admin access required",
      code: "UNAUTHORIZED",
    };
  }

  const result = await bulkUpdateStock(updates);
  if (result.success) {
    revalidatePath("/admin/products");
    revalidatePath("/products");
  }
  return result;
}

export async function bulkUpdatePricesAction(
  updates: Array<{ productId: string; price: number }>
) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return {
      success: false,
      error: "Unauthorized: Admin access required",
      code: "UNAUTHORIZED",
    };
  }

  const result = await bulkUpdatePrices(updates);
  if (result.success) {
    revalidatePath("/admin/products");
    revalidatePath("/products");
  }
  return result;
}
