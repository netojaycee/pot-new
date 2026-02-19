"use client";

import { useCartStore } from "@/stores/cart.store";
import { CartSummary } from "@/components/cart/cart-summary";
import Image from "next/image";

interface OrderSummaryProps {
  order?: any;
}

export function OrderSummary({ order }: OrderSummaryProps) {
    const { items } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Your cart is empty
            </div>
        );
    }
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Order Summary</h2>

            <div className="border rounded-lg p-4">
                <div className="space-y-2">
                    {items.map((item) => {
                        const subtotal = item.product.price * item.quantity;
                        return (
                            <div key={item.id} className="flex gap-3 py-3 border-b last:border-b-0">
                                {/* Product Image */}
                                <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                    {item.product.images && item.product.images.length > 0 ? (
                                        <Image
                                            src={item.product.images[0].url}
                                            alt={item.product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                            No image
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1">
                                    <h3 className="font-medium text-sm">{item.product.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Qty: {item.quantity} × £{item.product.price.toFixed(2)}
                                    </p>
                                </div>

                                {/* Subtotal */}
                                <div className="text-sm font-semibold">
                                    £{subtotal.toFixed(2)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 pt-4 border-t">
                  {order ? (
                    // Payment step: show order totals with tax/shipping
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>£{order.subtotal?.toFixed(2)}</span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="text-green-600">-£{order.discountAmount?.toFixed(2)}</span>
                        </div>
                      )}
                      {order.tax > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax</span>
                          <span>£{order.tax?.toFixed(2)}</span>
                        </div>
                      )}
                      {order.shippingFee >= 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>
                            {order.shippingFee === 0 ? (
                              <span className="text-green-600">Free</span>
                            ) : (
                              `£${order.shippingFee?.toFixed(2)}`
                            )}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total</span>
                        <span>£{order.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <CartSummary />
                  )}
                </div>
            </div>
        </div>
    );
}
