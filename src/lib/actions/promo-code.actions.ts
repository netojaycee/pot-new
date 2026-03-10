"use server";

import { promoCodeService } from "@/lib/services/promo-code.service";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============ READ ACTIONS ============

/**
 * Get all promo codes
 */
export async function getPromoCodesAction(filters?: {
  search?: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    const promoCodes = await promoCodeService.getAllPromoCodes(filters);
    return { success: true, data: promoCodes };
  } catch (error) {
    console.error("Get promo codes error:", error);
    return { success: false, error: "Failed to fetch promo codes" };
  }
}

/**
 * Get single promo code by ID
 */
export async function getPromoCodeAction(id: string) {
  try {
    if (!id || id.trim() === "") {
      return { success: false, error: "Promo code ID required" };
    }

    const promoCode = await promoCodeService.getPromoCodeById(id);
    if (!promoCode) {
      return { success: false, error: "Promo code not found" };
    }

    return { success: true, data: promoCode };
  } catch (error) {
    console.error("Get promo code error:", error);
    return { success: false, error: "Failed to fetch promo code" };
  }
}

/**
 * Validate promo code
 */
export async function validatePromoCodeAction(code: string, orderTotal: number) {
  try {
    const result = await promoCodeService.validatePromoCode(code, orderTotal);
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: {
        code: result.data.code,
        type: result.data.type,
        value: result.data.value,
        discount: result.data.type === "percent"
          ? (orderTotal * result.data.value) / 100
          : result.data.value,
      },
    };
  } catch (error) {
    console.error("Validate promo code error:", error);
    return { success: false, error: "Failed to validate promo code" };
  }
}

// ============ ADMIN WRITE ACTIONS ============

/**
 * Create new promo code
 */
export async function createPromoCodeAction(data: any) {
  try {
    const session = await getSession();
    if (!session || (session as any).role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const result = await promoCodeService.createPromoCode(data);
    if (!result.success) {
      return result;
    }

    revalidatePath("/admin/promo-codes");
    return result;
  } catch (error) {
    console.error("Create promo code error:", error);
    return {
      success: false,
      error: "Failed to create promo code",
      code: "CREATE_ERROR",
    };
  }
}

/**
 * Update promo code
 */
export async function updatePromoCodeAction(id: string, data: any) {
  try {
    const session = await getSession();
    if (!session || (session as any).role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const result = await promoCodeService.updatePromoCode(id, data);
    if (!result.success) {
      return result;
    }

    revalidatePath("/admin/promo-codes");
    revalidatePath(`/admin/promo-codes/${id}/edit`);
    return result;
  } catch (error) {
    console.error("Update promo code error:", error);
    return {
      success: false,
      error: "Failed to update promo code",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Delete promo code
 */
export async function deletePromoCodeAction(id: string) {
  try {
    const session = await getSession();
    if (!session || (session as any).role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const result = await promoCodeService.deletePromoCode(id);
    if (!result.success) {
      return result;
    }

    revalidatePath("/admin/promo-codes");
    return result;
  } catch (error) {
    console.error("Delete promo code error:", error);
    return {
      success: false,
      error: "Failed to delete promo code",
      code: "DELETE_ERROR",
    };
  }
}
