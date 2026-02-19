import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { z } from "zod";

const CACHE_TTL = 3600; // 1 hour

// Types
export type UserResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// Validation Schemas
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name required").optional(),
  lastName: z.string().min(1, "Last name required").optional(),
  image: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Helper: Invalidate user cache
async function invalidateUserCache(userId: string) {
  try {
    await redis.del(`user:${userId}`);
    await redis.del(`user:${userId}:orders`);
  } catch (error) {
    console.error("Redis cache invalidation error:", error);
  }
}

export const userService = {
  // ============ READ OPERATIONS ============

  /**
   * Get user by ID with caching
   */
  async getUserById(userId: string): Promise<any | null> {
    const cacheKey = `user:${userId}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        verified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (user) {
      try {
        await redis.set(cacheKey, user, { ex: CACHE_TTL });
      } catch (error) {
        console.error("Redis set error:", error);
      }
    }

    return user;
  },

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<any | null> {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        role: true,
        verified: true,
        image: true,
      },
    });
  },

  /**
   * Get user profile (authenticated)
   */
  async getProfile(userId: string): Promise<UserResult<any>> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return { success: false, error: "User not found", code: "NOT_FOUND" };
      }
      return { success: true, data: user };
    } catch (error) {
      console.error("Get profile error:", error);
      return {
        success: false,
        error: "Failed to fetch profile",
        code: "FETCH_ERROR",
      };
    }
  },

  /**
   * Get user addresses
   */
  async getAddresses(userId: string): Promise<any[]> {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get user orders
   */
  async getOrders(userId: string, limit = 10, offset = 0): Promise<any[]> {
    return prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } }, promoCode: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  },

  // ============ WRITE OPERATIONS ============

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileInput): Promise<UserResult<any>> {
    try {
      const validated = updateProfileSchema.parse(data);

      const user = await prisma.user.update({
        where: { id: userId },
        data: validated,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          image: true,
          role: true,
          verified: true,
        },
      });

      await invalidateUserCache(userId);

      return { success: true, data: user };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Update profile error:", error);
      return {
        success: false,
        error: "Failed to update profile",
        code: "UPDATE_ERROR",
      };
    }
  },

  /**
   * Change password
   */
  async changePassword(userId: string, data: ChangePasswordInput): Promise<UserResult<any>> {
    try {
      const validated = changePasswordSchema.parse(data);

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });

      if (!user || !user.password) {
        return {
          success: false,
          error: "User not found or password not set",
          code: "NOT_FOUND",
        };
      }

      // Verify current password
      const isValid = await verifyPassword(validated.currentPassword, user.password);
      if (!isValid) {
        return {
          success: false,
          error: "Current password is incorrect",
          code: "INVALID_PASSWORD",
        };
      }

      // Hash new password
      const hashedPassword = await hashPassword(validated.newPassword);

      // Update password
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
        select: { id: true, email: true },
      });

      await invalidateUserCache(userId);

      return { success: true, data: updated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Change password error:", error);
      return {
        success: false,
        error: "Failed to change password",
        code: "UPDATE_ERROR",
      };
    }
  },

  /**
   * Add address
   */
  async addAddress(
    userId: string,
    data: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
      isDefault?: boolean;
    }
  ): Promise<UserResult<any>> {
    try {
      // If this is default, unset other defaults
      if (data.isDefault) {
        await prisma.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const address = await prisma.address.create({
        data: { userId, ...data },
      });

      await invalidateUserCache(userId);

      return { success: true, data: address };
    } catch (error) {
      console.error("Add address error:", error);
      return {
        success: false,
        error: "Failed to add address",
        code: "CREATE_ERROR",
      };
    }
  },

  /**
   * Update address
   */
  async updateAddress(
    userId: string,
    addressId: string,
    data: Partial<{
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
      isDefault: boolean;
    }>
  ): Promise<UserResult<any>> {
    try {
      // Verify address belongs to user
      const address = await prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!address || address.userId !== userId) {
        return {
          success: false,
          error: "Address not found",
          code: "NOT_FOUND",
        };
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await prisma.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const updated = await prisma.address.update({
        where: { id: addressId },
        data,
      });

      await invalidateUserCache(userId);

      return { success: true, data: updated };
    } catch (error) {
      console.error("Update address error:", error);
      return {
        success: false,
        error: "Failed to update address",
        code: "UPDATE_ERROR",
      };
    }
  },

  /**
   * Delete address
   */
  async deleteAddress(userId: string, addressId: string): Promise<UserResult<any>> {
    try {
      // Verify address belongs to user
      const address = await prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!address || address.userId !== userId) {
        return {
          success: false,
          error: "Address not found",
          code: "NOT_FOUND",
        };
      }

      await prisma.address.delete({
        where: { id: addressId },
      });

      await invalidateUserCache(userId);

      return { success: true, data: { id: addressId } };
    } catch (error) {
      console.error("Delete address error:", error);
      return {
        success: false,
        error: "Failed to delete address",
        code: "DELETE_ERROR",
      };
    }
  },
};
