"use client";

import { useEffect, useState, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useCartStore,
  type CartItem as ZustandCartItem,
} from "@/stores/cart.store";
import {
  getCartAction,
  addToCartAction,
  updateCartItemAction,
  removeFromCartAction,
  clearCartAction,
  applyPromoCodeAction,
  validateCheckoutAction,
} from "@/lib/actions/cart.actions";
import { toast } from "sonner";

export type CartItem = ZustandCartItem;

export interface CartTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
}

export interface UseCartReturn {
  // State
  items: CartItem[];
  totals: CartTotals | null;
  loading: boolean;
  error: string | null;
  selectedItemIds: Set<string>;
  appliedPromo: { code: string; discount: number } | null;

  // Cart operations
  addItem: (productId: string, quantity: number) => Promise<boolean>;
  updateItem: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;

  // Selection operations
  selectItem: (itemId: string) => void;
  deselectItem: (itemId: string) => void;
  toggleSelectItem: (itemId: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;

  // Promo & checkout
  applyPromo: (code: string) => Promise<boolean>;
  validateForCheckout: () => Promise<boolean>;

  // Refetch
  refetch: () => Promise<void>;
}

/**
 * Architecture: Zustand + Server Actions Hybrid
 *
 * Data Flow:
 * Component
 *   ↓ calls hook method (e.g., updateItem)
 * useCart Hook
 *   ↓ updates Zustand immediately (optimistic UI)
 *   ↓ calls server action in background
 * Server Action (updateCartItemAction)
 *   ↓ calls service method (cartService.updateCartItem)
 * Service Layer (cartService)
 *   ↓ validates, updates database
 *   ↓ invalidates Redis cache
 * Hook receives response
 *   ↓ if error: refetch from server (data consistency)
 *   ↓ if success: state already synced via action cache revalidation
 *
 * Why This Works:
 * ✅ Instant UI Feedback - Zustand updates immediately
 * ✅ Data Accuracy - Server validates everything
 * ✅ Network Resilience - Refetch on error ensures consistency
 * ✅ Type Safety - Full TypeScript support
 * ✅ No API Routes - Pure server actions + services
 * ✅ Scalable - Business logic in service layer
 */
export function useCart(): UseCartReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<CartTotals | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  // Get Zustand store state and actions
  const {
    items,
    selectedItemIds,
    selectItem,
    deselectItem,
    toggleSelectItem,
    selectAllItems,
    deselectAllItems,
    setItems,
  } = useCartStore(
    useShallow((state) => ({
      items: state.items,
      selectedItemIds: state.selectedItemIds,
      selectItem: state.selectItem,
      deselectItem: state.deselectItem,
      toggleSelectItem: state.toggleSelectItem,
      selectAllItems: state.selectAllItems,
      deselectAllItems: state.deselectAllItems,
      setItems: state.setItems,
    })),
  );

  /**
   * Fetch cart from server on mount
   * Syncs Zustand state with server database
   */
  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCartAction();

      if (result.success && (result.data as any)) {
        // Update Zustand with server data
        const cartItems = ((result.data as any).items || []) as CartItem[];
        setItems(cartItems);

        // Calculate totals from items
        const subtotal = cartItems.reduce(
          (sum: number, item: CartItem) => sum + item.price * item.quantity,
          0,
        );
        const itemCount = cartItems.reduce(
          (sum: number, item: CartItem) => sum + item.quantity,
          0,
        );

        setTotals({
          subtotal,
          tax: Math.round(subtotal * 0.1 * 100) / 100,
          shipping: subtotal >= 50 ? 0 : 4.99,
          discount: 0,
          total:
            Math.round((subtotal * 1.1 + (subtotal >= 50 ? 0 : 4.99)) * 100) /
            100,
          itemCount,
        });

        setError(null);
      } else {
        setError(result.error || "Failed to load cart");
        setItems([]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load cart";
      setError(message);
      setItems([]);
    }

    setLoading(false);
  }, [setItems]);

  // Fetch on mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  /**
   * Add item to cart with optimistic update
   */
  const addItem = useCallback(
    async (productId: string, quantity: number) => {
      try {
        // Server action call
        const result = await addToCartAction({
          productId,
          quantity,
        });

        if (result.success) {
          // toast.success("Added to cart");
          await fetchCart(); // Sync state
          return true;
        } else {
          toast.error(result.error || "Failed to add to cart");
          return false;
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add to cart";
        toast.error(message);
        return false;
      }
    },
    [fetchCart],
  );

  /**
   * Update item quantity with optimistic update
   * 1. Validate against stock
   * 2. Update Zustand immediately (instant UI feedback)
   * 3. Call server action
   * 4. On error: refetch from server (rollback)
   */
  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        // Find the item to check stock
        const item = items.find((i) => i.id === itemId);
        if (!item) {
          toast.error("Item not found");
          return false;
        }

        // Check stock on client side (server will validate too)
        // Note: availableQuantity should be in cart.product if fetched properly
        // For now we'll let the server validate, but add this check if availableQuantity is provided
        const availableQty = (item as any).product?.availableQuantity;
        if (availableQty && quantity > availableQty) {
          toast.error(`Only ${availableQty} items available in stock`);
          return false;
        }

        // Save old state for rollback
        const oldItems = [...items];

        // Optimistic update to Zustand (instant UI)
        setItems(items.map((i) => (i.id === itemId ? { ...i, quantity } : i)));

        // Call server action in background
        const result = await updateCartItemAction(itemId, { quantity });

        if (result.success) {
          // Success - optimistic update was correct, no need to refetch
          return true;
        } else {
          // Rollback on error and refetch
          setItems(oldItems);
          toast.error(result.error || "Failed to update cart");
          await fetchCart(); // Resync if error
          return false;
        }
      } catch (err) {
        // Rollback and refetch on error
        await fetchCart();
        const message =
          err instanceof Error ? err.message : "Failed to update cart";
        toast.error(message);
        return false;
      }
    },
    [items, setItems, fetchCart],
  );

  /**
   * Remove item from cart with optimistic update
   */
  const removeItem = useCallback(
    async (itemId: string) => {
      try {
        // Save old state for rollback
        const oldItems = [...items];

        // Optimistic update
        setItems(items.filter((item) => item.id !== itemId));
        deselectItem(itemId);

        // Call server action
        const result = await removeFromCartAction(itemId);

        if (result.success) {
          // Success - optimistic update was correct
          toast.success("Removed from cart");
          return true;
        } else {
          // Rollback on error
          setItems(oldItems);
          toast.error(result.error || "Failed to remove from cart");
          await fetchCart(); // Resync if error
          return false;
        }
      } catch (err) {
        // Rollback and refetch on error
        await fetchCart();
        const message =
          err instanceof Error ? err.message : "Failed to remove from cart";
        toast.error(message);
        return false;
      }
    },
    [items, setItems, deselectItem, fetchCart],
  );

  /**
   * Clear entire cart
   */
  const clearCartFn = useCallback(async () => {
    try {
      // Save old state for rollback
      const oldItems = [...items];

      // Optimistic update
      setItems([]);
      deselectAllItems();

      // Call server action
      const result = await clearCartAction();

      if (result.success) {
        toast.success("Cart cleared");
        return true;
      } else {
        // Rollback on error
        setItems(oldItems);
        toast.error(result.error || "Failed to clear cart");
        await fetchCart(); // Resync if error
        return false;
      }
    } catch (err) {
      // Rollback and refetch on error
      await fetchCart();
      const message =
        err instanceof Error ? err.message : "Failed to clear cart";
      toast.error(message);
      return false;
    }
  }, [items, setItems, deselectAllItems, fetchCart]);

  /**
   * Apply promo code
   */
  const applyPromo = useCallback(
    async (code: string) => {
      try {
        const result = await applyPromoCodeAction(code);

        if (result.success) {
          setAppliedPromo({
            code: (result as any).data.code,
            discount: (result as any).data.discount || 0,
          });
          toast.success(`Promo code "${code}" applied!`);
          await fetchCart(); // Recalculate totals
          return true;
        } else {
          toast.error(result.error || "Failed to apply promo code");
          return false;
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to apply promo code";
        toast.error(message);
        return false;
      }
    },
    [fetchCart],
  );

  /**
   * Validate cart before checkout
   */
  const validateForCheckout = useCallback(async () => {
    try {
      const result = await validateCheckoutAction();

      if (result.success) {
        return true;
      } else {
        toast.error(result.error || "Cart validation failed");
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Validation failed";
      toast.error(message);
      return false;
    }
  }, []);

  /**
   * Manual refetch - useful after errors or external state changes
   */
  const refetch = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  return {
    // State
    items,
    totals,
    loading,
    error,
    selectedItemIds,
    appliedPromo,

    // Operations
    addItem,
    updateItem,
    removeItem,
    clearCart: clearCartFn,

    // Selection
    selectItem,
    deselectItem,
    toggleSelectItem,
    selectAllItems,
    deselectAllItems,

    // Promo & checkout
    applyPromo,
    validateForCheckout,

    // Utility
    refetch,
  };
}
