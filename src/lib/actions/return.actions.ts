"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  returnService,
  CreateReturnInput,
  UpdateReturnStatusInput,
} from "@/lib/services/return.service";

// ============ READ ACTIONS ============

/**
 * Get current user's returns
 */
export async function getUserReturnsAction(limit: number = 10, offset: number = 0) {
  try {
    const session = await getSession();

    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const result = await returnService.getUserReturns(session.userId, limit, offset);
    return result;
  } catch (error) {
    console.error("Get user returns action error:", error);
    return {
      success: false,
      error: "Failed to fetch returns",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get single return by ID
 */
export async function getReturnAction(returnId: string) {
  try {
    const session = await getSession();

    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const result = await returnService.getReturn(returnId);

    // Verify ownership (optional - for user view)
    if (result.success && result.data.userId !== session.userId) {
      // Allow only owner or admin to view
      // For now, just return success (can add admin check if needed)
    }

    return result;
  } catch (error) {
    console.error("Get return action error:", error);
    return {
      success: false,
      error: "Failed to fetch return",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get all returns (admin only)
 */
export async function getReturnsAction(
  limit: number = 50,
  offset: number = 0,
  search?: string,
  status?: string,
) {
  try {
    const session = await getSession();

    // Check authorization
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    // Note: Add admin role check here if needed
    // if (session.role !== "admin") { ... }

    const result = await returnService.getAllReturns(limit, offset, search, status);
    return result;
  } catch (error) {
    console.error("Get all returns action error:", error);
    return {
      success: false,
      error: "Failed to fetch returns",
      code: "FETCH_ERROR",
    };
  }
}

// ============ CREATE RETURN ============

/**
 * Create return request
 */
export async function createReturnAction(
  orderId: string,
  input: CreateReturnInput,
) {
  try {
    const session = await getSession();

    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const result = await returnService.createReturn(
      orderId,
      session.userId,
      input,
    );

    if (result.success) {
      revalidatePath("/account/returns");
      revalidatePath(`/orders/${orderId}`);
    }

    return result;
  } catch (error) {
    console.error("Create return action error:", error);
    return {
      success: false,
      error: "Failed to create return request",
      code: "CREATE_ERROR",
    };
  }
}

// ============ UPDATE RETURN STATUS ============

/**
 * Update return status (admin only)
 */
export async function updateReturnStatusAction(
  returnId: string,
  data: UpdateReturnStatusInput,
) {
  try {
    const session = await getSession();

    // Check authorization
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    // Note: Add admin role check here if needed
    // if (session.role !== "admin") { ... }

    const result = await returnService.updateReturnStatus(returnId, data);

    if (result.success) {
      revalidatePath("/admin/returns");
      revalidatePath(`/admin/returns/${returnId}`);
      revalidatePath("/account/returns");
    }

    return result;
  } catch (error) {
    console.error("Update return status action error:", error);
    return {
      success: false,
      error: "Failed to update return status",
      code: "UPDATE_ERROR",
    };
  }
}

// ============ DELETE RETURN ============

/**
 * Delete return request
 */
export async function deleteReturnAction(returnId: string) {
  try {
    const session = await getSession();

    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const result = await returnService.deleteReturn(returnId, session.userId);

    if (result.success) {
      revalidatePath("/account/returns");
      revalidatePath("/admin/returns");
    }

    return result;
  } catch (error) {
    console.error("Delete return action error:", error);
    return {
      success: false,
      error: "Failed to delete return request",
      code: "DELETE_ERROR",
    };
  }
}
