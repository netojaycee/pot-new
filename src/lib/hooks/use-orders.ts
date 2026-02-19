import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserOrdersAction,
  getOrderAction,
  createOrderAction,
  cancelOrderAction,
} from "@/lib/actions/order.actions";
import { CreateOrderInput } from "@/lib/services/order.service";

// Query key factory
export const orderQueryKeys = {
  all: ["orders"] as const,
  list: () => [...orderQueryKeys.all, "list"] as const,
  detail: (orderId: string) =>
    [...orderQueryKeys.all, "detail", orderId] as const,
};

// Get user's orders
export function useUserOrders(limit: number = 10, offset: number = 0) {
  return useQuery({
    queryKey: orderQueryKeys.list(),
    queryFn: async () => {
      const result = await getUserOrdersAction(limit, offset);
      if (!result.success) {
        throw new Error(result.error);
      }
      //   return result.data;
      return result;
    },
    retry: false,
  });
}

// Get single order
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: async () => {
      const result = await getOrderAction(orderId);
      if (!result.success) {
        throw new Error(result.error);
      }
      //   return result.data;
      return result;
    },
    retry: false,
  });
}

// Create order
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderInput) => {
      const result = await createOrderAction(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      //   return result.data;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.list() });
      // Optionally prefetch the new order detail
      queryClient.setQueryData(orderQueryKeys.detail((data as any).id), data);
    },
  });
}

// Cancel order
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const result = await cancelOrderAction(orderId);
      if (!result.success) {
        throw new Error(result.error);
      }
      //   return result.data;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.list() });
      queryClient.setQueryData(orderQueryKeys.detail((data as any).id), data);
    },
  });
}
