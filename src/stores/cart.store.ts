import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: Array<{
      url: string;
      pubId: string;
    }>;
  };
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  sessionId: string | null;
  selectedItemIds: Set<string>;
  
  // Cart Actions
  addItem: (item: Omit<CartItem, "id">) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  fetchCart: () => Promise<void>;
  setItems: (items: CartItem[]) => void;
  
  // UI Actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setSessionId: (sessionId: string) => void;
  
  // Selection Actions
  selectItem: (itemId: string) => void;
  deselectItem: (itemId: string) => void;
  toggleSelectItem: (itemId: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      sessionId: null,
      selectedItemIds: new Set(),

      // Set Items
      setItems: (items: CartItem[]) => {
        set({ items });
      },

      setSessionId: (sessionId: string) => {
        set({ sessionId });
      },

      // Selection Methods
      selectItem: (itemId: string) => {
        const selectedItemIds = new Set(get().selectedItemIds);
        selectedItemIds.add(itemId);
        set({ selectedItemIds });
      },

      deselectItem: (itemId: string) => {
        const selectedItemIds = new Set(get().selectedItemIds);
        selectedItemIds.delete(itemId);
        set({ selectedItemIds });
      },

      toggleSelectItem: (itemId: string) => {
        const selectedItemIds = new Set(get().selectedItemIds);
        if (selectedItemIds.has(itemId)) {
          selectedItemIds.delete(itemId);
        } else {
          selectedItemIds.add(itemId);
        }
        set({ selectedItemIds });
      },

      selectAllItems: () => {
        const selectedItemIds = new Set(get().items.map((item) => item.id));
        set({ selectedItemIds });
      },

      deselectAllItems: () => {
        set({ selectedItemIds: new Set() });
      },

      addItem: async (item) => {
        try {
          const response = await fetch("/api/v1/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: item.productId,
              quantity: item.quantity,
              sessionId: get().sessionId,
            }),
          });

          if (!response.ok) throw new Error("Failed to add item to cart");

          await get().fetchCart();
        } catch (error) {
          console.error("Error adding item to cart:", error);
        }
      },

      removeItem: async (itemId) => {
        try {
          const response = await fetch(`/api/v1/cart/${itemId}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error("Failed to remove item from cart");

          await get().fetchCart();
        } catch (error) {
          console.error("Error removing item from cart:", error);
        }
      },

      updateQuantity: async (itemId, quantity) => {
        try {
          const response = await fetch(`/api/v1/cart/${itemId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity }),
          });

          if (!response.ok) throw new Error("Failed to update quantity");

          await get().fetchCart();
        } catch (error) {
          console.error("Error updating quantity:", error);
        }
      },

      clearCart: () => {
        set({ items: [], selectedItemIds: new Set() });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      fetchCart: async () => {
        try {
          const sessionId = get().sessionId;
          const url = sessionId 
            ? `/api/v1/cart?sessionId=${sessionId}` 
            : "/api/v1/cart";
          
          const response = await fetch(url);

          if (!response.ok) {
            set({ items: [] });
            return;
          }

          const data = await response.json();
          
          const items: CartItem[] = data.items?.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            productImage: item.product.images[0] || "",
            price: item.price,
            quantity: item.quantity,
          })) || [];

          set({ items });
        } catch (error) {
          console.error("Error fetching cart:", error);
          set({ items: [] });
        }
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ sessionId: state.sessionId }),
    }
  )
);
