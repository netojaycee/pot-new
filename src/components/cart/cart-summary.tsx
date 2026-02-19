"use client";

import { useCartStore } from "@/stores/cart.store";
import { useMemo } from "react";

export function CartSummary() {
    const { items } = useCartStore();

    const subtotal = useMemo(() => {
        return items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
    }, [items]);

    return (
        <div className="space-y-3">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">£{subtotal.toFixed(2)}</span>
            </div>

            <div className="border-t pt-3">
                <div className="flex justify-between">
                    <span className="font-semibold">Estimated Total</span>
                    <span className="font-bold text-lg">£{subtotal.toFixed(2)}</span>
                </div>
            </div>

            <p className="text-xs text-muted-foreground text-center italic">
                Tax & shipping calculated at checkout based on your delivery address
            </p>
        </div>
    );
}
