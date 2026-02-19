import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPaymentIntentAction,
  getPaymentStatusAction,
  getPaymentInfoAction,
} from "@/lib/actions/payment.actions";

// Query key factory
export const paymentQueryKeys = {
  all: ["payments"] as const,
  status: (paymentIntentId: string) => [...paymentQueryKeys.all, "status", paymentIntentId] as const,
  info: (orderId: string) => [...paymentQueryKeys.all, "info", orderId] as const,
};

// Create payment intent
export function useCreatePaymentIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { orderId: string; amount: number; email: string }) => {
      const result = await createPaymentIntentAction(data);
      if (!result.success) {
        throw new Error(result.error);
      }
    //   return result.data;
    return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: paymentQueryKeys.all });
    },
  });
}

// Get payment status
export function usePaymentStatus(paymentIntentId?: string) {
  return useQuery({
    queryKey: paymentIntentId ? paymentQueryKeys.status(paymentIntentId) : ["payment-status"],
    queryFn: async () => {
      if (!paymentIntentId) throw new Error("Payment intent ID required");
      const result = await getPaymentStatusAction(paymentIntentId);
      if (!result.success) {
        throw new Error(result.error);
      }
    //   return result.data;
        return result;
    },
    enabled: !!paymentIntentId,
    retry: false,
  });
}

// Get payment info (order + payment details)
export function usePaymentInfo(orderId?: string) {
  return useQuery({
    queryKey: orderId ? paymentQueryKeys.info(orderId) : ["payment-info"],
    queryFn: async () => {
      if (!orderId) throw new Error("Order ID required");
      const result = await getPaymentInfoAction(orderId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!orderId,
    retry: false,
  });
}

// Poll payment status (useful for checking if payment completed)
export function usePaymentStatusPoll(paymentIntentId?: string, pollInterval: number = 2000) {
  return useQuery({
    queryKey: paymentIntentId ? paymentQueryKeys.status(paymentIntentId) : ["payment-status-poll"],
    queryFn: async () => {
      if (!paymentIntentId) throw new Error("Payment intent ID required");
      const result = await getPaymentStatusAction(paymentIntentId);
      if (!result.success) {
        throw new Error(result.error);
      }
    //   return result.data;
            return result;

    },
    enabled: !!paymentIntentId,
    refetchInterval: pollInterval,
  });
}
