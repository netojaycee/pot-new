"use client";

interface FreeDeliveryProgressProps {
  subtotal: number;
  freeDeliveryThreshold?: number;
}

export function FreeDeliveryProgress({
  subtotal,
  freeDeliveryThreshold = 50,
}: FreeDeliveryProgressProps) {
  const progressPercentage = Math.min((subtotal / freeDeliveryThreshold) * 100, 100);
  const remaining = Math.max(freeDeliveryThreshold - subtotal, 0);

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">🎁</span>
        <p className="text-sm font-semibold text-gray-900">
          Spend ${remaining.toFixed(2)} extra to get free delivery
        </p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      {remaining === 0 && (
        <p className="text-sm text-green-600 font-semibold mt-2">
          ✓ You qualify for free delivery!
        </p>
      )}
    </div>
  );
}
