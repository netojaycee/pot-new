import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWishlistAction,
  addToWishlistAction,
  removeFromWishlistAction,
  isProductInWishlistAction,
  getWishlistCountAction,
  clearWishlistAction,
} from "@/lib/actions/wishlist.actions";
import { AddToWishlistInput } from "@/lib/services/wishlist.service";

// ============ QUERY KEYS ============

const wishlistQueryKeys = {
  all: ["wishlist"] as const,
  current: () => [...wishlistQueryKeys.all, "current"] as const,
  count: () => [...wishlistQueryKeys.all, "count"] as const,
  isInWishlist: (productId: string) => [
    ...wishlistQueryKeys.all,
    "is-in",
    productId,
  ] as const,
};

// ============ WISHLIST HOOKS ============

export function useWishlist() {
  return useQuery({
    queryKey: wishlistQueryKeys.current(),
    queryFn: async () => {
      const result = await getWishlistAction();
      if (!result.success) throw new Error((result as any).error);
    //   return result.data;
                return result;

    },
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddToWishlistInput) => {
      const result = await addToWishlistAction(input);
      if (!result.success) throw new Error((result as any).error);
    //   return result.data;
                return result;

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.current() });
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.count() });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const result = await removeFromWishlistAction(productId);
      if (!result.success) throw new Error((result as any).error);
    //   return result.data;
                return result;

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.current() });
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.count() });
    },
  });
}

export function useIsProductInWishlist(productId: string) {
  return useQuery({
    queryKey: wishlistQueryKeys.isInWishlist(productId),
    queryFn: async () => {
      const result = await isProductInWishlistAction(productId);
      if (!result.success) throw new Error((result as any).error);
    //   return result.data;
                return result;

    },
  });
}

export function useWishlistCount() {
  return useQuery({
    queryKey: wishlistQueryKeys.count(),
    queryFn: async () => {
      const result = await getWishlistCountAction();
      if (!result.success) throw new Error((result as any).error);
    //   return result.data;
                return result;

    },
  });
}

export function useClearWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await clearWishlistAction();
      if (!result.success) throw new Error((result as any).error);
    //   return result.data;
                return result;

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.current() });
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.count() });
    },
  });
}
