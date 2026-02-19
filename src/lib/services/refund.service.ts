import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";
import { Prisma } from "@prisma/generated/client";

// ============ TYPES ============

export type RefundServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

export enum RefundStatus {
  REQUESTED = "requested",
  APPROVED = "approved",
  REJECTED = "rejected",
  PROCESSED = "processed",
  FAILED = "failed",
}

// ============ VALIDATION SCHEMAS ============

const createReturnSchema = z.object({
  orderId: z.string().min(1, "Order ID required"),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500),
  items: z.array(z.string()).min(1, "At least one item must be selected"),
});

export type CreateReturnInput = z.infer<typeof createReturnSchema>;

// ============ RETURN/REFUND OPERATIONS ============

/**
 * Create return request
 */
export async function createReturn(
  userId: string,
  input: CreateReturnInput
): Promise<RefundServiceResult<any>> {
  try {
    const validated = createReturnSchema.parse(input);

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: validated.orderId },
      include: { items: true },
    });

    if (!order) {
      return {
        success: false,
        error: "Order not found",
        code: "NOT_FOUND",
      };
    }

    if (order.userId !== userId) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    // Verify order can be returned (only within 30 days)
    const daysSinceOrder = Math.floor(
      (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceOrder > 30) {
      return {
        success: false,
        error: "Return period expired (30 days max)",
        code: "RETURN_EXPIRED",
      };
    }

    // Verify order status allows returns
    if (!["delivered", "paid"].includes(order.status)) {
      return {
        success: false,
        error: `Cannot return order with status: ${order.status}`,
        code: "INVALID_STATUS",
      };
    }

    // Calculate refund amount from items
    const returnItems = order.items.filter((item) =>
      validated.items.includes(item.id)
    );

    if (returnItems.length === 0) {
      return {
        success: false,
        error: "No valid items selected",
        code: "NO_ITEMS",
      };
    }

    const refundAmount = returnItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create return record
    const returnRequest = await prisma.return.create({
      data: {
        orderId: validated.orderId,
        userId,
        reason: validated.reason,
        items: validated.items,
        refundAmount,
        status: "requested",
      },
    });

    // Invalidate order cache
    await redis.del(`order:${validated.orderId}`);
    await redis.del(`user:${userId}:orders`);

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
}

/**
 * Get return by ID
 */
export async function getReturn(
  returnId: string,
  userId: string
): Promise<RefundServiceResult<any>> {
  try {
    const returnRequest = await prisma.return.findUnique({
      where: { id: returnId },
      include: { order: true },
    });

    if (!returnRequest) {
      return {
        success: false,
        error: "Return request not found",
        code: "NOT_FOUND",
      };
    }

    // Verify ownership
    if (returnRequest.userId !== userId) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    return { success: true, data: returnRequest };
  } catch (error) {
    console.error("Get return error:", error);
    return {
      success: false,
      error: "Failed to fetch return request",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get user's returns
 */
export async function getUserReturns(
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<
  RefundServiceResult<{
    returns: any[];
    total: number;
  }>
> {
  try {
    const total = await prisma.return.count({
      where: { userId },
    });

    const returns = await prisma.return.findMany({
      where: { userId },
      include: { order: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return {
      success: true,
      data: {
        returns,
        total,
      },
    };
  } catch (error) {
    console.error("Get user returns error:", error);
    return {
      success: false,
      error: "Failed to fetch returns",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Approve return request (admin only)
 */
export async function approveReturn(
  returnId: string
): Promise<RefundServiceResult<any>> {
  try {
    const returnRequest = await prisma.return.update({
      where: { id: returnId },
      data: {
        status: "approved",
        approvedAt: new Date(),
      },
      include: { order: true },
    });

    // Invalidate caches
    await redis.del(`order:${returnRequest.orderId}`);
    await redis.del(`user:${returnRequest.userId}:orders`);

    return { success: true, data: returnRequest };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Return request not found",
          code: "NOT_FOUND",
        };
      }
    }
    console.error("Approve return error:", error);
    return {
      success: false,
      error: "Failed to approve return",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Reject return request (admin only)
 */
export async function rejectReturn(
  returnId: string,
  rejectionReason: string
): Promise<RefundServiceResult<any>> {
  try {
    const returnRequest = await prisma.return.update({
      where: { id: returnId },
      data: {
        status: "rejected",
        rejectionReason,
        rejectedAt: new Date(),
      },
      include: { order: true },
    });

    return { success: true, data: returnRequest };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Return request not found",
          code: "NOT_FOUND",
        };
      }
    }
    console.error("Reject return error:", error);
    return {
      success: false,
      error: "Failed to reject return",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Process refund for approved return (admin/system)
 */
export async function processRefund(
  returnId: string,
  stripeRefundId?: string
): Promise<RefundServiceResult<any>> {
  try {
    const returnRequest = await prisma.return.findUnique({
      where: { id: returnId },
      include: { order: { include: { payment: true } } },
    });

    if (!returnRequest) {
      return {
        success: false,
        error: "Return request not found",
        code: "NOT_FOUND",
      };
    }

    if (returnRequest.status !== "approved") {
      return {
        success: false,
        error: "Return must be approved before processing refund",
        code: "NOT_APPROVED",
      };
    }

    // Update return status
    const updated = await prisma.return.update({
      where: { id: returnId },
      data: {
        status: "processed",
        refundId: stripeRefundId,
        refundedAt: new Date(),
      },
      include: { order: true },
    });

    // Update payment record if exists
    if (returnRequest.order.payment) {
      await prisma.payment.update({
        where: { id: returnRequest.order.payment.id },
        data: {
          status: "refunded",
          refundAmount: returnRequest.refundAmount,
        },
      });
    }

    // Invalidate caches
    await redis.del(`order:${returnRequest.orderId}`);
    await redis.del(`user:${returnRequest.userId}:orders`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("Process refund error:", error);
    return {
      success: false,
      error: "Failed to process refund",
      code: "PROCESS_ERROR",
    };
  }
}
