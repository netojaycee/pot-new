"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCart } from "@/lib/hooks/use-cart";
import { Loader2 } from "lucide-react";

export function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  async function handleAddToCart() {
    setLoading(true);
    try {
      const success = await addItem(productId, quantity);

      if (success) {
        toast.success(
          `Added ${quantity} item${quantity > 1 ? "s" : ""} to cart`,
        );
        setQuantity(1); // Reset quantity after successful add
      }
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      {/* Quantity controls - commented out for now */}
      {/* <div className="flex items-center border border-gray-300 rounded">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={loading || quantity <= 1}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          −
        </button>
        <span className="px-4 py-2 min-w-12 text-center font-semibold">
          {quantity}
        </span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          disabled={loading}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100"
        >
          +
        </button>
      </div> */}

      <Button
        onClick={handleAddToCart}
        disabled={loading}
        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
      >
        {loading && <Loader2 className="animate-spin mr-2" />}
        {loading ? "Processing..." : "Add to Cart"}
      </Button>
    </div>
  );
}
