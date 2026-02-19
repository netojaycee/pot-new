"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore, CartItem } from "@/stores/cart.store";

interface CartItemsSectionProps {
  items: CartItem[];
  selectedItems: Set<string>;
  onSelectItem: (itemId: string) => void;
  onSelectAll: (select: boolean) => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => Promise<boolean>;
  onRemoveItem?: (itemId: string) => Promise<boolean>;
}

export function CartItemsSection({
  items,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onUpdateQuantity,
  onRemoveItem,
}: CartItemsSectionProps) {
  const { updateQuantity, removeItem } = useCartStore();

  // Use provided callbacks or fall back to Zustand methods
  const handleIncrement = async (item: CartItem) => {
    const newQuantity = item.quantity + 1;
    if (onUpdateQuantity) {
      await onUpdateQuantity(item.id, newQuantity);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

//   console.log(items)

  const handleDecrement = async (item: CartItem) => {
    if (item.quantity > 1) {
      const newQuantity = item.quantity - 1;
      if (onUpdateQuantity) {
        await onUpdateQuantity(item.id, newQuantity);
      } else {
        updateQuantity(item.id, newQuantity);
      }
    }
  };

  const handleRemove = async (itemId: string) => {
    if (onRemoveItem) {
      await onRemoveItem(itemId);
    } else {
      removeItem(itemId);
    }
  };

  return (
    <div className="bg-white rounded border">
      {/* Header with Select All */}
      <div className="bg-[#F5F5F5] flex items-center justify-between p-3 border-b">
        <span className="flex items-center gap-2 font-semibold text-sm">
          📦 ITEM
        </span>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedItems.size === items.length && items.length > 0}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-3 h-3 rounded border-gray-300 cursor-pointer"
          />
          <span className="text-sm font-semibold text-gray-700">
            Select All ({items.length})
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3 p-2 md:p-4">
        {items.map((item) => {
          const isSelected = selectedItems.has(item.id);
          const subtotal = item.price * item.quantity;

          return (
            <div
              key={item.id}
              className={`flex gap-2 p-2 border rounded transition ${
                isSelected
                  ? "bg-green-50 border-green-200"
                  : "border-gray-200 bg-[#F5F5F5]"
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelectItem(item.id)}
                className="w-3 h-3 rounded border-gray-300 cursor-pointer mt-1 shrink-0"
              />

              {/* Product Image */}
              <div className="relative w-20 h-20 rounded overflow-hidden bg-gray-100 shrink-0">
                {item.product.images && item.product.images.length > 0 ? (
                  <Image
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    fill
                    className="object-contain p-1"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
              </div>

              {/* Product Info & Controls Container */}
              <div className="flex-1 flex flex-col">
                {/* Top Row: Product name and Delete button */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-1">
                      {item.product.name}
                    </h3>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      ${item.product.price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-red-500 hover:text-red-700 shrink-0 p-2 -mt-2 -mr-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Bottom Row: Subtotal + Quantity Controls on same line */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Subtotal: ${subtotal.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecrement(item)}
                      disabled={item.quantity <= 1}
                      className="p-1 hover:bg-gray-200 rounded-full bg-white disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrement(item)}
                      className="p-1 hover:bg-gray-200 rounded-full bg-white shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
