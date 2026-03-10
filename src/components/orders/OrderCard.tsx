"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

interface OrderItem {
  id: string;
  product?: {
    name: string;
  };
}

interface OrderCardProps {
  id: string;
  orderNumber: string;
  status: "draft" | "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "failed";
  createdAt: Date;
  total: number;
  itemCount: number;
  items?: OrderItem[];
  currency?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Processing", color: "bg-blue-100 text-blue-800" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "On delivery", color: "bg-orange-100 text-orange-800" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  failed: { label: "Failed", color: "bg-red-100 text-red-800" },
};

export function OrderCard({
  id,
  orderNumber,
  status,
  createdAt,
  total,
  itemCount,
  items = [],
  currency = "CAD",
}: OrderCardProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const formattedDate = new Date(createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = new Date(createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
      {/* Top Section - Items Count and Total */}
      <div className="flex items-center justify-between mb-4">
        <p className="underline text-sm font-semibold text-gray-900">
          {itemCount} {itemCount === 1 ? "item" : "items"} ordered
        </p>
        <p className="text-lg font-bold text-gray-900">
          {currency.toUpperCase()} {total.toFixed(2)}
        </p>
      </div>

      {/* Order Number - Clickable */}
      <Link href={`/orders/${orderNumber}`}>
        <h3 className="font-semibold text-gray-900 text-sm hover:text-primary transition">
          Order #{orderNumber}
        </h3>
      </Link>

      {/* Product Names - Clickable to Order Details */}
      <div className="my-3 space-y-1">
        {items.length > 0 ? (
          items.map((item) => (
            <Link key={item.id} href={`/orders/${orderNumber}`}>
              <p className="text-sm text-gray-600 hover:text-primary transition">
                {item.product?.name || "Product"}
              </p>
            </Link>
          ))
        ) : (
          <p className="text-sm text-gray-600">Items</p>
        )}
      </div>

      {/* Bottom Section - Status and Date/Time */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
        <Badge className={`${config.color} whitespace-nowrap text-xs rounded`}>
          {config.label}
        </Badge>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
