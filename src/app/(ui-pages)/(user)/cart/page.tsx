"use client";

import Link from "next/link";
import { useCart } from "@/lib/hooks/use-cart";
import { CartItemsSection } from "@/components/cart/CartItemsSection";
import { FreeDeliveryProgress } from "@/components/cart/FreeDeliveryProgress";
import { PromoCodeSection } from "@/components/cart/PromoCodeSection";
import { OrderSummaryCart } from "@/components/cart/OrderSummaryCart";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Cart Page
 *
 * Data Flow:
 * 1. useCart hook fetches cart from server on mount via getCartAction
 * 2. Cart data displayed from Zustand state (items)
 * 3. User interacts: remove, update quantity (all items included)
 * 4. Hook methods call server actions + update Zustand optimistically
 * 5. Server actions call services which update database
 * 6. OrderSummaryCart calculates totals from ALL items (no selection)
 * 7. User applies promo code via applyPromo hook method
 * 8. User clicks "Proceed to Checkout" → validateForCheckout sends entire cart
 * 9. Checkout page creates order with all cart items and payment
 */
export default function CartPage() {
  const {
    items,
    totals,
    loading,
    error,
    appliedPromo,
    updateItem,
    removeItem,
    applyPromo,
    validateForCheckout,
    refetch,
  } = useCart();

  // Calculate totals using all items
  const allItemsSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const allItemsDiscount =
    appliedPromo && allItemsSubtotal > 0
      ? allItemsSubtotal * (appliedPromo.discount / 100)
      : 0;

  const allItemsTax =
    Math.round((allItemsSubtotal - allItemsDiscount) * 0.1 * 100) / 100;

  const allItemsShipping =
    allItemsSubtotal >= 50 || items.length === 0 ? 0 : 4.99;

  const allItemsTotal =
    allItemsSubtotal - allItemsDiscount + allItemsTax + allItemsShipping;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen px-4 lg:px-16 bg-white">
        <div className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded" />
              ))}
            </div>
            <div>
              <Skeleton className="h-96 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart</h1>
          <p className="text-gray-600 mb-8">Your cart is empty</p>
          <Link
            href="/"
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 lg:px-16 bg-white">
      {/* Main Content */}
      <div className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-2">
            {/* Free Delivery Progress */}
            {/* <FreeDeliveryProgress subtotal={totals?.subtotal || 0} /> */}

            {/* Cart Items */}
            <CartItemsSection
              items={items}
              onUpdateQuantity={updateItem}
              onRemoveItem={removeItem}
            />

            {/* Promo Code */}
            <PromoCodeSection
              onApplyPromo={applyPromo}
              appliedPromo={appliedPromo?.code}
              discount={allItemsDiscount}
            />
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <OrderSummaryCart
              subtotal={allItemsSubtotal}
              discountAmount={allItemsDiscount}
              tax={allItemsTax}
              shipping={allItemsShipping}
              total={allItemsTotal}
              itemsCount={items.length}
              isPromoApplied={appliedPromo !== null}
              onCheckout={validateForCheckout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
