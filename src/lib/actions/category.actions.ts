"use server";

import { getSession } from "@/lib/auth";
import {
  categoryService,
  CreateCategoryInput,
  UpdateCategoryInput,
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/services/category.service";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/utils";

// ============ PUBLIC READ ACTIONS ============

/**
 * Get all categories
 */
export async function getCategoriesAction(filters?: {
  type?: "item" | "food" | "giftbox";
  limit?: number;
  offset?: number;
}) {
  try {
    const categories = await categoryService.getAllCategories(filters);
    return { success: true, data: categories };
  } catch (error) {
    console.error("Get categories error:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}

/**
 * Get single category
 */
export async function getCategoryAction(identifier: string) {
  try {
    if (!identifier || identifier.trim() === "") {
      return { success: false, error: "Category identifier required" };
    }

    const category = await categoryService.getCategoryByIdentifier(identifier);
    if (!category) {
      return { success: false, error: "Category not found" };
    }

    return { success: true, data: category };
  } catch (error) {
    console.error("Get category error:", error);
    return { success: false, error: "Failed to fetch category" };
  }
}

/**
 * Get root categories
 */
export async function getRootCategoriesAction(type?: "item" | "food" | "giftbox") {
  try {
    const categories = await categoryService.getRootCategories(type);
    return { success: true, data: categories };
  } catch (error) {
    console.error("Get root categories error:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}

// ============ ADMIN WRITE ACTIONS ============

/**
 * Create a category (admin only)
 */
export async function createCategoryAction(input: CreateCategoryInput) {
  try {
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

    const enriched = { ...input, slug: generateSlug(input.name || "") };
    const validated = createCategorySchema.safeParse(enriched);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }

    const result = await categoryService.createCategory(validated.data);

    if (result.success) {
      revalidatePath("/admin/categories");
      revalidatePath("/");
    }

    return result;
  } catch (error) {
    console.error("Create category action error:", error);
    return {
      success: false,
      error: "Failed to create category",
      code: "CREATE_ERROR",
    };
  }
}

/**
 * Update a category (admin only)
 */
export async function updateCategoryAction(id: string, input: UpdateCategoryInput) {
  try {
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
        error: "Category ID required",
        code: "INVALID_ID",
      };
    }

    const enriched = input.name ? { ...input, slug: generateSlug(input.name) } : input;
    const validated = updateCategorySchema.safeParse(enriched);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }

    const result = await categoryService.updateCategory(id, validated.data);

    if (result.success) {
      revalidatePath("/admin/categories");
      revalidatePath("/");
    }

    return result;
  } catch (error) {
    console.error("Update category action error:", error);
    return {
      success: false,
      error: "Failed to update category",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Delete a category (admin only)
 */
export async function deleteCategoryAction(id: string) {
  try {
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
        error: "Category ID required",
        code: "INVALID_ID",
      };
    }

    const result = await categoryService.deleteCategory(id);

    if (result.success) {
      revalidatePath("/admin/categories");
      revalidatePath("/");
    }

    return result;
  } catch (error) {
    console.error("Delete category action error:", error);
    return {
      success: false,
      error: "Failed to delete category",
      code: "DELETE_ERROR",
    };
  }
}
