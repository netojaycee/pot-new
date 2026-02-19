/**
 * Client-side utilities for cart operations
 * These are helper functions to work with the cart hooks
 */

export interface CartOperationResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Calculate cart totals
export function calculateCartTotals(cart: any): {
  subtotal: number;
  itemCount: number;
  isEmpty: boolean;
} {
  if (!cart || !cart.items || cart.items.length === 0) {
    return { subtotal: 0, itemCount: 0, isEmpty: true };
  }

  const subtotal = cart.items.reduce(
    (sum: number, item: any) => sum + (item.price * item.quantity),
    0
  );

  const itemCount = cart.items.reduce((count: number, item: any) => count + item.quantity, 0);

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    itemCount,
    isEmpty: false,
  };
}

// Format price for display
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

// Check if product is in cart
export function isProductInCart(cart: any, productId: string): boolean {
  if (!cart || !cart.items) return false;
  return cart.items.some((item: any) => item.productId === productId);
}

// Get product quantity in cart
export function getProductQuantityInCart(cart: any, productId: string): number {
  if (!cart || !cart.items) return 0;
  const item = cart.items.find((item: any) => item.productId === productId);
  return item?.quantity || 0;
}

// Get cart item by ID
export function getCartItemById(cart: any, itemId: string): any | null {
  if (!cart || !cart.items) return null;
  return cart.items.find((item: any) => item.id === itemId) || null;
}

// Get cart item by product ID
export function getCartItemByProductId(cart: any, productId: string): any | null {
  if (!cart || !cart.items) return null;
  return cart.items.find((item: any) => item.productId === productId) || null;
}

// Validate quantity
export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}

// Get maximum orderable quantity (common constraint)
export function getMaxOrderableQuantity(): number {
  return 999; // Adjust based on business logic
}

// Build cart summary text for notifications
export function buildCartSummaryText(cart: any): string {
  const { itemCount, subtotal } = calculateCartTotals(cart);

  if (itemCount === 0) {
    return "Cart is empty";
  }

  const itemText = itemCount === 1 ? "item" : "items";
  return `${itemCount} ${itemText} - ${formatPrice(subtotal)}`;
}

// Prepare cart data for checkout
export function prepareCartForCheckout(cart: any): {
  cartItems: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
} {
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const { subtotal } = calculateCartTotals(cart);

  const cartItems = cart.items.map((item: any) => ({
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
  }));

  return {
    cartItems,
    subtotal,
  };
}
