"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession, getOrCreateGuestSession } from "@/lib/auth";
import { cartService, AddToCartInput, UpdateCartItemInput } from "@/lib/services/cart.service";

// ============ READ ACTIONS ============

/**
 * Get user or guest cart
 */
export async function getCartAction() {
  try {
    const session = await getSession();

    if (session && "userId" in session) {
      // Authenticated user
      const cart = await cartService.getCart(undefined, session.userId);
      return { success: true, data: cart };
    } else if (session && session.isGuest) {
      // Guest with session
      const cart = await cartService.getCart(session.sessionId, undefined);
      return { success: true, data: cart };
    } else {
      // No session yet - return null (cart empty)
      return { success: true, data: null };
    }
  } catch (error) {
    console.error("Get cart error:", error);
    return {
      success: false,
      error: "Failed to fetch cart",
      code: "FETCH_ERROR",
    };
  }
}

// ============ WRITE ACTIONS ============

/**
 * Add item to cart
 * Creates guest session if needed for guests
 */
export async function addToCartAction(input: AddToCartInput) {
  try {
    // Validate input
    const validated = z
      .object({
        productId: z.string().min(1, "Product ID required"),
        quantity: z.number().int().positive("Quantity must be positive"),
      })
      .safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }

    let session = await getSession();

    if (!session) {
      // Create guest session for first action
      session = await getOrCreateGuestSession();
    }

    if (session && "userId" in session) {
      // Authenticated user
      const result = await cartService.addToCart(validated.data, session.userId);
      if (result.success) revalidatePath("/");
      return result;
    } else if (session && session.isGuest) {
      // Guest
      const result = await cartService.addToCart(validated.data, undefined, session.sessionId);
      if (result.success) revalidatePath("/");
      return result;
    }

    return {
      success: false,
      error: "Unable to create session",
      code: "SESSION_ERROR",
    };
  } catch (error) {
    console.error("Add to cart error:", error);
    return {
      success: false,
      error: "Failed to add item to cart",
      code: "ADD_ERROR",
    };
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemAction(itemId: string, input: UpdateCartItemInput) {
  try {
    // Validate input
    const validated = z
      .object({
        quantity: z.number().int().positive("Quantity must be positive"),
      })
      .safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }

    const session = await getSession();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    if ("userId" in session) {
      // Authenticated user
      const result = await cartService.updateCartItem(itemId, validated.data, session.userId);
      if (result.success) revalidatePath("/");
      return result;
    } else if (session.isGuest) {
      // Guest
      const result = await cartService.updateCartItem(itemId, validated.data, undefined, session.sessionId);
      if (result.success) revalidatePath("/");
      return result;
    }

    return {
      success: false,
      error: "Invalid session",
      code: "INVALID_SESSION",
    };
  } catch (error) {
    console.error("Update cart item error:", error);
    return {
      success: false,
      error: "Failed to update cart item",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCartAction(itemId: string) {
  try {
    const session = await getSession();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    if ("userId" in session) {
      // Authenticated user
      const result = await cartService.removeFromCart(itemId, session.userId);
      if (result.success) revalidatePath("/");
      return result;
    } else if (session.isGuest) {
      // Guest
      const result = await cartService.removeFromCart(itemId, undefined, session.sessionId);
      if (result.success) revalidatePath("/");
      return result;
    }

    return {
      success: false,
      error: "Invalid session",
      code: "INVALID_SESSION",
    };
  } catch (error) {
    console.error("Remove from cart error:", error);
    return {
      success: false,
      error: "Failed to remove item from cart",
      code: "DELETE_ERROR",
    };
  }
}

/**
 * Clear entire cart
 */
export async function clearCartAction() {
  try {
    const session = await getSession();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    if ("userId" in session) {
      // Authenticated user
      const result = await cartService.clearCart(session.userId);
      if (result.success) revalidatePath("/");
      return result;
    } else if (session.isGuest) {
      // Guest
      const result = await cartService.clearCart(undefined, session.sessionId);
      if (result.success) revalidatePath("/");
      return result;
    }

    return {
      success: false,
      error: "Invalid session",
      code: "INVALID_SESSION",
    };
  } catch (error) {
    console.error("Clear cart error:", error);
    return {
      success: false,
      error: "Failed to clear cart",
      code: "DELETE_ERROR",
    };
  }
}

// ============ MERGE ACTION ============

/**
 * Merge guest cart to user cart on registration/login
 * Called automatically after user creates account or logs in
 */
export async function mergeGuestCartAction(sessionId: string) {
  try {
    const session = await getSession();

    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const result = await cartService.mergeGuestCartToUser(session.userId, sessionId);

    if (result.success) {
      revalidatePath("/");
    }

    return result;
  } catch (error) {
    console.error("Merge cart error:", error);
    return {
      success: false,
      error: "Failed to merge carts",
      code: "MERGE_ERROR",
    };
  }
}
// ============ ADDITIONAL ACTIONS ============

/**
 * Apply promo code to cart
 */
export async function applyPromoCodeAction(code: string) {
  try {
    if (!code || code.trim() === "") {
      return {
        success: false,
        error: "Promo code required",
        code: "INVALID_CODE",
      };
    }

    const session = await getSession();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    if ("userId" in session) {
      const result = await cartService.applyPromoCode(session.userId, code);
      if (result.success) revalidatePath("/cart");
      return result;
    } else if (session.isGuest) {
      const result = await cartService.applyPromoCode(undefined, code, session.sessionId);
      if (result.success) revalidatePath("/cart");
      return result;
    }

    return {
      success: false,
      error: "Invalid session",
      code: "INVALID_SESSION",
    };
  } catch (error) {
    console.error("Apply promo code error:", error);
    return {
      success: false,
      error: "Failed to apply promo code",
      code: "PROMO_ERROR",
    };
  }
}

/**
 * Validate cart before checkout (check stock, prices, etc)
 */
export async function validateCheckoutAction() {
  try {
    const session = await getSession();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }
    if ("userId" in session) {
      const result = await cartService.validateCheckout(session.userId);
      return result;
    } else if (session.isGuest) {
      const result = await cartService.validateCheckout(undefined, session.sessionId);
      return result;
    }

    return {
      success: false,
      error: "Invalid session",
      code: "INVALID_SESSION",
    };
  } catch (error) {
    console.error("Validate checkout error:", error);
    return {
      success: false,
      error: "Failed to validate checkout",
      code: "VALIDATION_ERROR",
    };
  }
}