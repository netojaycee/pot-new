"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart.store";
import { createId as cuid } from "@paralleldrive/cuid2";

export function useInitializeCart() {
  const { sessionId, setSessionId, fetchCart } = useCartStore();

  useEffect(() => {
    // Generate session ID for guest users if not exists
    if (!sessionId) {
      const newSessionId = cuid();
      setSessionId(newSessionId);
    }

    // Fetch cart on initialization
    fetchCart();
  }, [sessionId, setSessionId, fetchCart]);
}
