"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationById,
  createAdminNotification,
  CreateNotificationInput,
} from "@/lib/services/notification.service";

// ============ NOTIFICATION ACTIONS ============

export async function getUserNotificationsAction(
  limit?: number,
  offset?: number
) {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  return await getUserNotifications(session.userId, limit, offset);
}

export async function getUnreadNotificationCountAction() {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return { success: true, data: 0 };
  }

  return await getUnreadNotificationCount(session.userId);
}

export async function markNotificationAsReadAction(notificationId: string) {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  const result = await markNotificationAsRead(
    notificationId,
    session.userId
  );
  if (result.success) {
    revalidatePath("/notifications");
  }
  return result;
}

export async function markAllAsReadAction() {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  const result = await markAllAsRead(session.userId);
  if (result.success) {
    revalidatePath("/notifications");
  }
  return result;
}

export async function deleteNotificationAction(notificationId: string) {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  const result = await deleteNotification(notificationId, session.userId);
  if (result.success) {
    revalidatePath("/notifications");
  }
  return result;
}

export async function clearAllNotificationsAction() {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  const result = await clearAllNotifications(session.userId);
  if (result.success) {
    revalidatePath("/notifications");
  }
  return result;
}

export async function getNotificationByIdAction(notificationId: string) {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  return await getNotificationById(notificationId, session.userId);
}

// ============ ADMIN NOTIFICATION ACTIONS ============

export async function createAdminNotificationAction(
  input: Omit<CreateNotificationInput, "userId">
) {
  const session = await getSession();

  // TODO: Verify user is admin
  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  return await createAdminNotification(input);
}
