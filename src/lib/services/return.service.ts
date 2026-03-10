import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";

const CACHE_TTL = 1800; // 30 minutes for returns

// Types
export type ReturnResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// Validation Schemas
export const createReturnSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    }),
  ).min(1, "At least one item must be selected"),
});

export const updateReturnStatusSchema = z.object({
  status: z.enum(["requested", "approved", "rejected", "processed"]),
  rejectionReason: z.string().optional(),
  refundAmount: z.number().optional(),
});

export type CreateReturnInput = z.infer<typeof createReturnSchema>;
export type UpdateReturnStatusInput = z.infer<typeof updateReturnStatusSchema>;

// Helper: Invalidate return cache
async function invalidateReturnCache(userId?: string, orderId?: string) {
  try {
    if (userId) {
      await redis.del(`returns:user:${userId}`);
    }
    if (orderId) {
      await redis.del(`returns:order:${orderId}`);
    }
  } catch (error) {
    console.error("Redis cache invalidation error:", error);
  }
}

export const returnService = {
  // ============ READ OPERATIONS ============

  /**
   * Get user's returns (paginated)
   */
  async getUserReturns(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<ReturnResult<{ returns: any[]; total: number }>> {
    try {
      const cacheKey = `returns:user:${userId}`;
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return { success: true, data: cached as any };
      } catch (error) {
        console.error("Redis get error:", error);
      }

      const [returns, total] = await Promise.all([
        prisma.return.findMany({
          where: { userId },
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.return.count({ where: { userId } }),
      ]);

      const result = { returns, total };

      try {
        await redis.set(cacheKey, result, { ex: CACHE_TTL });
      } catch (error) {
        console.error("Redis set error:", error);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Get user returns error:", error);
      return {
        success: false,
        error: "Failed to fetch returns",
        code: "FETCH_ERROR",
      };
    }
  },

  /**
   * Get single return by ID
   */
  async getReturn(returnId: string): Promise<ReturnResult<any>> {
    try {
      const returnRequest = await prisma.return.findUnique({
        where: { id: returnId },
        include: {
          order: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!returnRequest) {
        return {
          success: false,
          error: "Return request not found",
          code: "NOT_FOUND",
        };
      }

      return { success: true, data: returnRequest };
    } catch (error) {
      console.error("Get return error:", error);
      return {
        success: false,
        error: "Failed to fetch return",
        code: "FETCH_ERROR",
      };
    }
  },

  /**
   * Get all returns (admin only)
   */
  async getAllReturns(
    limit: number = 50,
    offset: number = 0,
    search?: string,
    status?: string,
  ): Promise<ReturnResult<{ returns: any[]; total: number }>> {
    try {
      const where: any = {};

      // Filter by search term (order number or customer email/name)
      if (search && search.trim()) {
        where.OR = [
          { order: { orderNumber: { contains: search, mode: "insensitive" } } },
          { order: { email: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { reason: { contains: search, mode: "insensitive" } },
        ];
      }

      // Filter by status
      if (status && status !== "all") {
        where.status = status;
      }

      const [returns, total] = await Promise.all([
        prisma.return.findMany({
          where,
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.return.count({ where }),
      ]);

      return { success: true, data: { returns, total } };
    } catch (error) {
      console.error("Get all returns error:", error);
      return {
        success: false,
        error: "Failed to fetch returns",
        code: "FETCH_ERROR",
      };
    }
  },

  // ============ CREATE RETURN ============

  /**
   * Create return request
   */
  async createReturn(
    orderId: string,
    userId: string,
    data: CreateReturnInput,
  ): Promise<ReturnResult<any>> {
    try {
      const validated = createReturnSchema.parse(data);

      // Verify order exists and belongs to user
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return {
          success: false,
          error: "Order not found",
          code: "NOT_FOUND",
        };
      }

      if (order.userId !== userId && order.guestSessionId) {
        return {
          success: false,
          error: "Unauthorized - order does not belong to user",
          code: "FORBIDDEN",
        };
      }

      // Calculate refund amount (sum of item prices)
      const refundAmount = validated.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // Create return request
      const returnRequest = await prisma.return.create({
        data: {
          orderId,
          userId,
          reason: validated.reason,
          items: validated.items,
          refundAmount,
          status: "requested",
        },
        include: {
          order: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Invalidate caches
      await invalidateReturnCache(userId, orderId);

      return { success: true, data: returnRequest };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Create return error:", error);
      return {
        success: false,
        error: "Failed to create return request",
        code: "CREATE_ERROR",
      };
    }
  },

  // ============ UPDATE RETURN STATUS ============

  /**
   * Update return status (admin only)
   */
  async updateReturnStatus(
    returnId: string,
    data: UpdateReturnStatusInput,
  ): Promise<ReturnResult<any>> {
    try {
      const validated = updateReturnStatusSchema.parse(data);

      // Check return exists
      const returnRequest = await prisma.return.findUnique({
        where: { id: returnId },
      });

      if (!returnRequest) {
        return {
          success: false,
          error: "Return request not found",
          code: "NOT_FOUND",
        };
      }

      // Prepare update data
      const updateData: any = {
        status: validated.status,
      };

      if (validated.status === "approved") {
        updateData.approvedAt = new Date();
      } else if (validated.status === "rejected") {
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = validated.rejectionReason || "No reason provided";
      } else if (validated.status === "processed") {
        updateData.refundedAt = new Date();
        if (validated.refundAmount) {
          updateData.refundAmount = validated.refundAmount;
        }
      }

      const updated = await prisma.return.update({
        where: { id: returnId },
        data: updateData,
        include: {
          order: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Invalidate caches
      await invalidateReturnCache(updated.userId, updated.orderId);

      return { success: true, data: updated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Update return status error:", error);
      return {
        success: false,
        error: "Failed to update return status",
        code: "UPDATE_ERROR",
      };
    }
  },

  // ============ DELETE RETURN ============

  /**
   * Delete return (only if in requested status)
   */
  async deleteReturn(returnId: string, userId?: string): Promise<ReturnResult<any>> {
    try {
      const returnRequest = await prisma.return.findUnique({
        where: { id: returnId },
      });

      if (!returnRequest) {
        return {
          success: false,
          error: "Return request not found",
          code: "NOT_FOUND",
        };
      }

      // Verify ownership (if userId provided)
      if (userId && returnRequest.userId !== userId) {
        return {
          success: false,
          error: "Unauthorized",
          code: "FORBIDDEN",
        };
      }

      // Can only delete if requested status
      if (returnRequest.status !== "requested") {
        return {
          success: false,
          error: "Can only delete return requests in 'requested' status",
          code: "INVALID_STATUS",
        };
      }

      await prisma.return.delete({
        where: { id: returnId },
      });

      // Invalidate caches
      await invalidateReturnCache(userId, returnRequest.orderId);

      return { success: true, data: { message: "Return request deleted" } };
    } catch (error) {
      console.error("Delete return error:", error);
      return {
        success: false,
        error: "Failed to delete return request",
        code: "DELETE_ERROR",
      };
    }
  },
};
