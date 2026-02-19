"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PromoCodeSectionProps {
  onApplyPromo: (code: string) => Promise<boolean>;
  appliedPromo?: string;
  discount?: number;
}

export function PromoCodeSection({
  onApplyPromo,
  appliedPromo,
  discount,
}: PromoCodeSectionProps) {
  const [promoCode, setPromoCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleApply = async () => {
    if (!promoCode.trim()) return;

    setIsLoading(true);
    try {
      const success = await onApplyPromo(promoCode);
      if (success) {
        setPromoCode("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApply();
    }
  };

  return (
    <div className="bg-white rounded-lg mt-2 mb-4">
      {/* <label className="block text-sm font-semibold text-gray-700 mb-3">
        Promo Code
      </label> */}

      <div className="relative">
        <input
          type="text"
          placeholder="Enter promo code here"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          disabled={isLoading || !!appliedPromo}
          className="w-full px-4 py-2 pr-20 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
        />
        <button
          onClick={handleApply}
          disabled={!promoCode.trim() || isLoading || !!appliedPromo}
          className="absolute right-1 top-1/2 -translate-y-1/2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-semibold px-4 py-1 rounded text-sm transition"
        >
          {isLoading ? "..." : "Apply"}
        </button>
      </div>

      {appliedPromo && discount ? (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-semibold">
            ✓ Promo code &quot;{appliedPromo}&quot; applied
          </p>
          <p className="text-sm text-green-600 mt-1">
            Discount: ${discount.toFixed(2)}
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-500 mt-2">
          Enter a valid promo code to get a discount
        </p>
      )}
    </div>
  );
}
