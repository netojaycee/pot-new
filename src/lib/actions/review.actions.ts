"use server";

import { getSession } from "@/lib/auth";
import {
  reviewService,
  CreateReviewInput,
  UpdateReviewInput,
  createReviewSchema,
  updateReviewSchema,
} from "@/lib/services/review.service";
import { revalidatePath } from "next/cache";

// ============ PUBLIC READ ACTIONS ============

/**
 * Get product reviews
 */
export async function getProductReviewsAction(productId: string, limit = 10, offset = 0) {
  try {
    if (!productId || productId.trim() === "") {
      return { success: false, error: "Product ID required" };
    }

    const reviews = await reviewService.getProductReviews(productId, limit, offset);
    return { success: true, data: reviews };
  } catch (error) {
    console.error("Get product reviews error:", error);
    return { success: false, error: "Failed to fetch reviews" };
  }
}

/**
 * Check if user has already reviewed product
 */
export async function hasReviewedProductAction(productId: string) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return { success: true, data: false };
    }

    const hasReviewed = await reviewService.hasUserReviewedProduct(session.userId, productId);
    return { success: true, data: hasReviewed };
  } catch (error) {
    console.error("Check review error:", error);
    return { success: false, error: "Failed to check review status" };
  }
}

// ============ USER WRITE ACTIONS ============

/**
 * Create a review (authenticated users only)
 */
export async function createReviewAction(input: CreateReviewInput) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Please log in to leave a review",
        code: "UNAUTHORIZED",
      };
    }

    const validated = createReviewSchema.safeParse({
      ...input,
      userId: session.userId,
    });

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }

    const result = await reviewService.createReview(validated.data);

    if (result.success) {
      revalidatePath(`/product/${input.productId}`);
    }

    return result;
  } catch (error) {
    console.error("Create review action error:", error);
    return {
      success: false,
      error: "Failed to create review",
      code: "CREATE_ERROR",
    };
  }
}

/**
 * Update a review (user can only update their own)
 */
export async function updateReviewAction(reviewId: string, input: UpdateReviewInput) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    if (!reviewId || reviewId.trim() === "") {
      return {
        success: false,
        error: "Review ID required",
        code: "INVALID_ID",
      };
    }

    const validated = updateReviewSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }

    const result = await reviewService.updateReview(reviewId, session.userId, validated.data);

    if (result.success) {
      revalidatePath("/");
    }

    return result;
  } catch (error) {
    console.error("Update review action error:", error);
    return {
      success: false,
      error: "Failed to update review",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Delete a review (user can only delete their own)
 */
export async function deleteReviewAction(reviewId: string) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    if (!reviewId || reviewId.trim() === "") {
      return {
        success: false,
        error: "Review ID required",
        code: "INVALID_ID",
      };
    }

    const result = await reviewService.deleteReview(reviewId, session.userId);

    if (result.success) {
      revalidatePath("/");
    }

    return result;
  } catch (error) {
    console.error("Delete review action error:", error);
    return {
      success: false,
      error: "Failed to delete review",
      code: "DELETE_ERROR",
    };
  }
}
