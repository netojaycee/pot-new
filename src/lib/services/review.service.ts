import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";

const CACHE_TTL = 3600; // 1 hour

// Types
export type ReviewResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// Validation Schemas
export const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  message: z.string().min(1, "Review message required").max(1000),
  productId: z.string().min(1, "Product ID required"),
  userId: z.string().min(1, "User ID required"),
});

export const updateReviewSchema = createReviewSchema.partial().omit({ productId: true, userId: true });

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

// Helper: Invalidate review cache
async function invalidateReviewCache(productId?: string) {
  try {
    if (productId) {
      await redis.del(`product:${productId}:reviews`);
    }
    // Also invalidate product cache since rating changed
    if (productId) {
      await redis.del(`product:${productId}`);
    }
  } catch (error) {
    console.error("Redis cache invalidation error:", error);
  }
}

// Helper: Transform DB reviews to UI format
function transformReviews(reviews: any[]): any[] {
  return reviews.map((review) => ({
    rating: Math.round(review.rating),
    comment: review.message,
    name: review.user?.firstName || "Anonymous",
    date: new Date(review.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  }));
}

// Helper: Update product review stats
async function updateProductReviewStats(productId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
    });

    if (reviews.length === 0) {
      await prisma.product.update({
        where: { id: productId },
        data: { avgRating: 0, reviewCount: 0 },
      });
      return;
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        reviewCount: reviews.length,
      },
    });
  } catch (error) {
    console.error("Update product review stats error:", error);
  }
}

export const reviewService = {
  // ============ READ OPERATIONS ============

  /**
   * Get reviews for a product
   */
  async getProductReviews(productId: string, limit = 10, offset = 0): Promise<any[]> {
    const cacheKey = `product:${productId}:reviews:${offset}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached as any[];
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, firstName: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const transformed = transformReviews(reviews);

    try {
      await redis.set(cacheKey, transformed, { ex: CACHE_TTL });
    } catch (error) {
      console.error("Redis set error:", error);
    }

    return transformed;
  },

  /**
   * Get user reviews
   */
  async getUserReviews(userId: string): Promise<any[]> {
    return prisma.review.findMany({
      where: { userId },
      include: { product: { select: { id: true, name: true, images: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get single review
   */
  async getReview(reviewId: string): Promise<any | null> {
    return prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: { select: { id: true, firstName: true, image: true } },
        product: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Check if user already reviewed product
   */
  async hasUserReviewedProduct(userId: string, productId: string): Promise<boolean> {
    const review = await prisma.review.findFirst({
      where: { userId, productId },
    });
    return !!review;
  },

  // ============ WRITE OPERATIONS ============

  /**
   * Create a review
   */
  async createReview(data: CreateReviewInput): Promise<ReviewResult<any>> {
    try {
      const validated = createReviewSchema.parse(data);

      // Check if user already reviewed this product
      const existing = await prisma.review.findFirst({
        where: {
          userId: validated.userId,
          productId: validated.productId,
        },
      });

      if (existing) {
        return {
          success: false,
          error: "You have already reviewed this product",
          code: "REVIEW_EXISTS",
        };
      }

      // Verify product exists
      const product = await prisma.product.findUnique({
        where: { id: validated.productId },
      });
      if (!product) {
        return { success: false, error: "Product not found", code: "PRODUCT_NOT_FOUND" };
      }

      const review = await prisma.review.create({
        data: validated,
        include: {
          user: { select: { id: true, firstName: true, image: true } },
        },
      });

      // Update product review stats
      await updateProductReviewStats(validated.productId);
      await invalidateReviewCache(validated.productId);

      return { success: true, data: review };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Create review error:", error);
      return {
        success: false,
        error: "Failed to create review",
        code: "CREATE_ERROR",
      };
    }
  },

  /**
   * Update a review (user can only update their own)
   */
  async updateReview(
    reviewId: string,
    userId: string,
    data: UpdateReviewInput
  ): Promise<ReviewResult<any>> {
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        return { success: false, error: "Review not found", code: "NOT_FOUND" };
      }

      if (review.userId !== userId) {
        return {
          success: false,
          error: "You can only update your own reviews",
          code: "FORBIDDEN",
        };
      }

      const validated = updateReviewSchema.parse(data);

      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: validated,
        include: {
          user: { select: { id: true, firstName: true, image: true } },
        },
      });

      // Update product review stats
      await updateProductReviewStats(review.productId);
      await invalidateReviewCache(review.productId);

      return { success: true, data: updated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Update review error:", error);
      return {
        success: false,
        error: "Failed to update review",
        code: "UPDATE_ERROR",
      };
    }
  },

  /**
   * Delete a review (user can only delete their own)
   */
  async deleteReview(reviewId: string, userId: string): Promise<ReviewResult<any>> {
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        return { success: false, error: "Review not found", code: "NOT_FOUND" };
      }

      if (review.userId !== userId) {
        return {
          success: false,
          error: "You can only delete your own reviews",
          code: "FORBIDDEN",
        };
      }

      const deleted = await prisma.review.delete({
        where: { id: reviewId },
      });

      // Update product review stats
      await updateProductReviewStats(review.productId);
      await invalidateReviewCache(review.productId);

      return { success: true, data: deleted };
    } catch (error) {
      console.error("Delete review error:", error);
      return {
        success: false,
        error: "Failed to delete review",
        code: "DELETE_ERROR",
      };
    }
  },
};
