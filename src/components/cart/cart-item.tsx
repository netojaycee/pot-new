"use client";

import { useCartStore, CartItem } from "@/stores/cart.store";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface CartItemComponentProps {
    item: CartItem;
}

export function CartItemComponent({ item }: CartItemComponentProps) {
    const { updateQuantity, removeItem } = useCartStore();

    const handleIncrement = () => {
        updateQuantity(item.id, item.quantity + 1);
    };

    const handleDecrement = () => {
        if (item.quantity > 1) {
            updateQuantity(item.id, item.quantity - 1);
        }
    };

    const handleRemove = () => {
        removeItem(item.id);
    };

    const subtotal = item.product.price * item.quantity;

    return (
        <div className="flex gap-4 py-4 border-b ">
            <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-100">
                {item.product.images && item.product.images.length > 0 ? (
                    <Image
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="font-medium text-sm">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        ${item.product.price.toFixed(2)}
                    </p>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleDecrement}
                            disabled={item.quantity <= 1}
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleIncrement}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <p className="font-semibold text-sm">${subtotal.toFixed(2)}</p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={handleRemove}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
