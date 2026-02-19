import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createReturnAction,
  getReturnAction,
  getUserReturnsAction,
  approveReturnAction,
  rejectReturnAction,
  processRefundAction,
} from "@/lib/actions/refund.actions";
import { CreateReturnInput } from "@/lib/services/refund.service";

// ============ QUERY KEYS ============

const refundQueryKeys = {
  all: ["returns"] as const,
  list: () => [...refundQueryKeys.all, "list"] as const,
  detail: (id: string) => [...refundQueryKeys.all, "detail", id] as const,
};

// ============ RETURN/REFUND HOOKS ============

export function useUserReturns(limit?: number, offset?: number) {
  return useQuery({
    queryKey: refundQueryKeys.list(),
    queryFn: async () => {
      const result = await getUserReturnsAction(limit, offset);
      if (!result.success) throw new Error(result.error);
    //   return result.data;
                return result;

    },
  });
}

export function useReturnDetail(returnId: string) {
  return useQuery({
    queryKey: refundQueryKeys.detail(returnId),
    queryFn: async () => {
      const result = await getReturnAction(returnId);
      if (!result.success) throw new Error(result.error);
    //   return result.data;
                return result;

    },
    enabled: !!returnId,
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReturnInput) => {
      const result = await createReturnAction(input);
      if (!result.success) throw new Error(result.error);
    //   return result.data;
                return result;

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.list() });
    },
  });
}

export function useApproveReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (returnId: string) => {
      const result = await approveReturnAction(returnId);
      if (!result.success) throw new Error(result.error);
    //   return result.data;
                return result;

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.all });
    },
  });
}

export function useRejectReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      returnId,
      rejectionReason,
    }: {
      returnId: string;
      rejectionReason: string;
    }) => {
      const result = await rejectReturnAction(returnId, rejectionReason);
      if (!result.success) throw new Error(result.error);
    //   return result.data;
                return result;

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.all });
    },
  });
}

export function useProcessRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      returnId,
      stripeRefundId,
    }: {
      returnId: string;
      stripeRefundId?: string;
    }) => {
      const result = await processRefundAction(returnId, stripeRefundId);
      if (!result.success) throw new Error(result.error);
    //   return result.data;
                return result;

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundQueryKeys.all });
    },
  });
}
