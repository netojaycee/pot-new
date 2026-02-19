import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";
import { Prisma } from "@prisma/generated/client";

// ============ TYPES ============

export type WishlistServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// ============ VALIDATION SCHEMAS ============

const addToWishlistSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
});

export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;

// ============ WISHLIST OPERATIONS ============

/**
 * Get user's wishlist
 */
export async function getWishlist(
  userId: string
): Promise<WishlistServiceResult<any[]>> {
  try {
    const cacheKey = `wishlist:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return { success: true, data: JSON.parse(cached as string) };
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                reviews: { select: { rating: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!wishlist) {
      return { success: true, data: [] };
    }

    const items = wishlist.items.map((item) => item.product);

    // Cache for 30 minutes
    await redis.setex(cacheKey, 1800, JSON.stringify(items));

    return { success: true, data: items };
  } catch (error) {
    console.error("Get wishlist error:", error);
    return {
      success: false,
      error: "Failed to fetch wishlist",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Add product to wishlist
 */
export async function addToWishlist(
  userId: string,
  input: AddToWishlistInput
): Promise<WishlistServiceResult<any>> {
  try {
    const validated = addToWishlistSchema.parse(input);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
    });

    if (!product) {
      return {
        success: false,
        error: "Product not found",
        code: "NOT_FOUND",
      };
    }

    // Get or create wishlist for user
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          userId,
        },
      });
    }

    // Check if product already in wishlist
    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId: validated.productId,
      },
    });

    if (existingItem) {
      return {
        success: false,
        error: "Product already in wishlist",
        code: "ALREADY_EXISTS",
      };
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: validated.productId,
      },
      include: {
        product: {
          include: {
            category: true,
            reviews: { select: { rating: true } },
          },
        },
      },
    });

    // Invalidate cache
    await redis.del(`wishlist:${userId}`);

    return { success: true, data: wishlistItem.product };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }
    console.error("Add to wishlist error:", error);
    return {
      success: false,
      error: "Failed to add to wishlist",
      code: "ADD_ERROR",
    };
  }
}

/**
 * Remove product from wishlist
 */
export async function removeFromWishlist(
  userId: string,
  productId: string
): Promise<WishlistServiceResult<void>> {
  try {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      return {
        success: false,
        error: "Wishlist not found",
        code: "NOT_FOUND",
      };
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    // Invalidate cache
    await redis.del(`wishlist:${userId}`);

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Item not in wishlist",
          code: "NOT_FOUND",
        };
      }
    }
    console.error("Remove from wishlist error:", error);
    return {
      success: false,
      error: "Failed to remove from wishlist",
      code: "REMOVE_ERROR",
    };
  }
}

/**
 * Check if product is in user's wishlist
 */
export async function isProductInWishlist(
  userId: string,
  productId: string
): Promise<WishlistServiceResult<boolean>> {
  try {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!wishlist) {
      return { success: true, data: false };
    }

    const item = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
      select: { id: true },
    });

    return { success: true, data: !!item };
  } catch (error) {
    console.error("Check wishlist error:", error);
    return {
      success: false,
      error: "Failed to check wishlist",
      code: "CHECK_ERROR",
    };
  }
}

/**
 * Get wishlist count for user
 */
export async function getWishlistCount(
  userId: string
): Promise<WishlistServiceResult<number>> {
  try {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      select: { _count: { select: { items: true } } },
    });

    return { success: true, data: wishlist?._count.items || 0 };
  } catch (error) {
    console.error("Get wishlist count error:", error);
    return {
      success: false,
      error: "Failed to get wishlist count",
      code: "COUNT_ERROR",
    };
  }
}

/**
 * Clear entire wishlist
 */
export async function clearWishlist(
  userId: string
): Promise<WishlistServiceResult<void>> {
  try {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (wishlist) {
      await prisma.wishlistItem.deleteMany({
        where: { wishlistId: wishlist.id },
      });
    }

    // Invalidate cache
    await redis.del(`wishlist:${userId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Clear wishlist error:", error);
    return {
      success: false,
      error: "Failed to clear wishlist",
      code: "CLEAR_ERROR",
    };
  }
}
