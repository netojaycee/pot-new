import { useQuery, useMutation, useQueryClient, useIsMutating } from "@tanstack/react-query";
import {
  getUserNotificationsAction,
  getUnreadNotificationCountAction,
  markNotificationAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
  clearAllNotificationsAction,
  getNotificationByIdAction,
  createAdminNotificationAction,
} from "@/lib/actions/notification.actions";
import { CreateNotificationInput } from "@/lib/services/notification.service";

// ============ QUERY KEYS ============

const notificationQueryKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationQueryKeys.all, "list"] as const,
  detail: (id: string) => [...notificationQueryKeys.all, "detail", id] as const,
  unreadCount: () => [...notificationQueryKeys.all, "unread-count"] as const,
};

// ============ NOTIFICATION HOOKS ============

export function useNotifications(limit?: number, offset?: number) {
  return useQuery({
    queryKey: notificationQueryKeys.list(),
    queryFn: async () => {
      const result = await getUserNotificationsAction(limit, offset);
      if (!result.success) throw new Error(result.error);
    //   return result.data;
                return result;

    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: async () => {
      const result = await getUnreadNotificationCountAction();
      if (!result.success) throw new Error((result as any).error);
    //   return result.data;
                return result;

    },
    refetchInterval: 30000, // Refetch every 30 seconds for badge updates
  });
}

export function useNotificationDetail(notificationId: string) {
  return useQuery({
    queryKey: notificationQueryKeys.detail(notificationId),
    queryFn: async () => {
      const result = await getNotificationByIdAction(notificationId);
      if (!result.success) throw new Error(result.error);
    //   return result.data;
                return result;

    },
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const result = await markNotificationAsReadAction(notificationId);
      if (!result.success) throw new Error(result.error);
    //   return result.data;
                return result;

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount() });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await markAllAsReadAction();
      if (!result.success) throw new Error(result.error);
    //   return result.data;
                return result;

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount() });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const result = await deleteNotificationAction(notificationId);
      if (!result.success) throw new Error(result.error);
    //   return result.data;
                return result;

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount() });
    },
  });
}

export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await clearAllNotificationsAction();
      if (!result.success) throw new Error(result.error);
    //   return result.data;
                return result;

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount() });
    },
  });
}

export function useCreateAdminNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CreateNotificationInput, "userId">) => {
      const result = await createAdminNotificationAction(input);
      if (!result.success) throw new Error(result.error);
    //   return result.data;
                return result;

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}
