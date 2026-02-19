import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";
import { Prisma } from "@prisma/generated/client";

// ============ TYPES ============

export type NotificationServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

export type NotificationType =
  | "order_confirmed"
  | "order_shipped"
  | "order_delivered"
  | "payment_failed"
  | "payment_received"
  | "review_approved"
  | "admin_alert"
  | "system";

export interface NotificationData {
  orderId?: string;
  paymentId?: string;
  reviewId?: string;
  productId?: string;
  message?: string;
  [key: string]: any;
}

// ============ VALIDATION SCHEMAS ============

const createNotificationSchema = z.object({
  userId: z.string().min(1, "User ID required"),
  type: z.enum([
    "order_confirmed",
    "order_shipped",
    "order_delivered",
    "payment_failed",
    "payment_received",
    "review_approved",
    "admin_alert",
    "system",
  ]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  data: z.record(z.string(), z.any()).optional(),
  actionUrl: z.string().url().optional(),
  icon: z.string().optional(),
});

export type CreateNotificationInput = z.infer<
  typeof createNotificationSchema
>;

// ============ NOTIFICATION OPERATIONS ============

/**
 * Create a notification
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationServiceResult<any>> {
  try {
    const validated = createNotificationSchema.parse(input);

    const notification = await prisma.notification.create({
      data: {
        userId: validated.userId,
        type: validated.type,
        title: validated.title,
        body: validated.body,
        data: validated.data || {},
        actionUrl: validated.actionUrl,
        icon: validated.icon,
        isRead: false,
      },
    });

    // Invalidate user notification cache
    await redis.del(`notifications:${validated.userId}`);
    await redis.del(`notifications:unread_count:${validated.userId}`);

    return { success: true, data: notification };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }
    console.error("Create notification error:", error);
    return {
      success: false,
      error: "Failed to create notification",
      code: "CREATE_ERROR",
    };
  }
}

/**
 * Get user's notifications (paginated)
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<
  NotificationServiceResult<{
    notifications: any[];
    total: number;
    unreadCount: number;
  }>
> {
  try {
    // Try to get from cache (only unread count is cached separately)
    const unreadCountKey = `notifications:unread_count:${userId}`;
    const cachedUnreadCount = await redis.get(unreadCountKey);
    let unreadCount = typeof cachedUnreadCount === 'string'
      ? parseInt(cachedUnreadCount, 10)
      : undefined;

    // Get total count
    const total = await prisma.notification.count({
      where: { userId },
    });

    if (unreadCount === undefined) {
      unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });
      // Cache unread count for 5 minutes
      await redis.setex(unreadCountKey, 300, unreadCount.toString());
    }

    // Get paginated notifications
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return {
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
      },
    };
  } catch (error) {
    console.error("Get notifications error:", error);
    return {
      success: false,
      error: "Failed to fetch notifications",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get unread notification count (for badge)
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<NotificationServiceResult<number>> {
  try {
    // Check cache first
    const cacheKey = `notifications:unread_count:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return { success: true, data: parseInt(cached as string) };
    }

    // Get from DB
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, count.toString());

    return { success: true, data: count };
  } catch (error) {
    console.error("Get unread count error:", error);
    return {
      success: false,
      error: "Failed to get unread count",
      code: "COUNT_ERROR",
    };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<NotificationServiceResult<any>> {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    // Verify ownership
    if (notification.userId !== userId) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    // Invalidate caches
    await redis.del(`notifications:unread_count:${userId}`);

    return { success: true, data: notification };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Notification not found",
          code: "NOT_FOUND",
        };
      }
    }
    console.error("Mark as read error:", error);
    return {
      success: false,
      error: "Failed to mark notification as read",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(
  userId: string
): Promise<NotificationServiceResult<number>> {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    // Invalidate caches
    await redis.del(`notifications:unread_count:${userId}`);

    return { success: true, data: result.count };
  } catch (error) {
    console.error("Mark all as read error:", error);
    return {
      success: false,
      error: "Failed to mark notifications as read",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<NotificationServiceResult<void>> {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });

    if (!notification) {
      return {
        success: false,
        error: "Notification not found",
        code: "NOT_FOUND",
      };
    }

    // Verify ownership
    if (notification.userId !== userId) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    // Invalidate caches
    await redis.del(`notifications:unread_count:${userId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Delete notification error:", error);
    return {
      success: false,
      error: "Failed to delete notification",
      code: "DELETE_ERROR",
    };
  }
}

/**
 * Clear all notifications for user
 */
export async function clearAllNotifications(
  userId: string
): Promise<NotificationServiceResult<number>> {
  try {
    const result = await prisma.notification.deleteMany({
      where: { userId },
    });

    // Invalidate caches
    await redis.del(`notifications:unread_count:${userId}`);

    return { success: true, data: result.count };
  } catch (error) {
    console.error("Clear all notifications error:", error);
    return {
      success: false,
      error: "Failed to clear notifications",
      code: "DELETE_ERROR",
    };
  }
}

/**
 * Get notification by ID (for preview/details)
 */
export async function getNotificationById(
  notificationId: string,
  userId: string
): Promise<NotificationServiceResult<any>> {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return {
        success: false,
        error: "Notification not found",
        code: "NOT_FOUND",
      };
    }

    // Verify ownership
    if (notification.userId !== userId) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    return { success: true, data: notification };
  } catch (error) {
    console.error("Get notification error:", error);
    return {
      success: false,
      error: "Failed to fetch notification",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Create notification for admins (broadcast to all admins)
 */
export async function createAdminNotification(
  input: Omit<CreateNotificationInput, "userId">
): Promise<NotificationServiceResult<number>> {
  try {
    const validated = createNotificationSchema.omit({ userId: true }).parse(input);

    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true },
    });

    if (admins.length === 0) {
      return {
        success: false,
        error: "No admins found",
        code: "NO_ADMINS",
      };
    }

    // Create notification for each admin
    const notifications = await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: validated.type,
        title: validated.title,
        body: validated.body,
        data: validated.data || {},
        actionUrl: validated.actionUrl,
        icon: validated.icon,
        isRead: false,
      })),
    });

    // Invalidate all admin caches
    for (const admin of admins) {
      await redis.del(`notifications:unread_count:${admin.id}`);
    }

    return { success: true, data: notifications.count };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }
    console.error("Create admin notification error:", error);
    return {
      success: false,
      error: "Failed to create admin notification",
      code: "CREATE_ERROR",
    };
  }
}
