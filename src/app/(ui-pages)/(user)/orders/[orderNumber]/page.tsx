"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { getOrderAction } from "@/lib/actions/order.actions";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  Phone,
  MapPin,
  Package,
  Truck,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  email: string;
  firstName: string;
  lastName: string;
  items: Array<{
    id: string;
    product: any;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discountAmount: number;
  tax: number;
  shippingFee: number;
  total: number;
  deliveryAddress: {
    street: string;
    town?: string;
    county?: string;
    zip: string;
  };
  occasion?: string;
  specialMessage?: string;
}

function getTimelineSteps(status: string, createdAt: Date) {
  const statusMap: Record<
    string,
    Array<{
      label: string;
      status: "completed" | "pending";
      description?: string;
    }>
  > = {
    paid: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      { label: "Package Prepared", status: "pending" },
      { label: "In Transit", status: "pending" },
      { label: "Out for Delivery", status: "pending" },
      { label: "Delivered", status: "pending" },
    ],
    processing: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      { label: "Package Prepared", status: "pending" },
      { label: "In Transit", status: "pending" },
      { label: "Out for Delivery", status: "pending" },
      { label: "Delivered", status: "pending" },
    ],
    shipped: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      {
        label: "Package Prepared",
        status: "completed",
        description: "Gift package assembled",
      },
      {
        label: "In Transit",
        status: "completed",
        description: "Package handed to courier and is on the way.",
      },
      {
        label: "Out for Delivery",
        status: "pending",
        description: "Estimated later today",
      },
      { label: "Delivered", status: "pending" },
    ],
    delivered: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      {
        label: "Package Prepared",
        status: "completed",
        description: "Gift package assembled",
      },
      { label: "In Transit", status: "completed" },
      { label: "Out for Delivery", status: "completed" },
      { label: "Delivered", status: "completed" },
    ],
    cancelled: [
      { label: "Order Confirmed", status: "completed" },
      { label: "Cancelled", status: "pending" },
    ],
  };

  return (
    statusMap[status] || [
      { label: "Order Confirmed", status: "completed" as const },
      { label: "Processing", status: "pending" as const },
    ]
  ).map((step) => ({
    ...step,
    timestamp: createdAt,
  }));
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) return;

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const result = await getOrderAction(orderNumber);

        if (result.success) {
          setOrder((result as any)?.data);

          console.log("Fetched order details:", (result as any)?.data);
        } else {
          setError(result.error || "Order not found");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen px-4 lg:px-16 py-8 bg-white">
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen px-4 lg:px-16 py-8 bg-white">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>
        <div className="max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600 text-lg font-semibold">{error}</p>
            <Link
              href="/orders"
              className="mt-4 inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const createdAtDate = typeof order.createdAt === 'string' 
    ? new Date(order.createdAt) 
    : order.createdAt;

  const timelineSteps = getTimelineSteps(
    order.status,
    createdAtDate,
  );

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

  const statusInfo = statusConfig[order.status] || statusConfig.pending;

  return (
    <div className="min-h-screen px-4 lg:px-16 py-8 bg-white">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="max-w-7xl">
        {/* Order Header - Title, Status, Date/Time */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={`${statusInfo.color} text-xs font-medium`}>
              {statusInfo.label}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Package className="w-4 h-4" />
              <span>
                {createdAtDate.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                {createdAtDate.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* ORDER SUMMARY */}
            <div className="border rounded">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide bg-[#FAFAFA] border-b border-gray-200 p-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Order Summary
              </h2>
              <div className="p-4 space-y-4">
                {/* Product Items */}
                <div className="space-y-3">
                  {order.items.map((item) => {
                    const productImage = item.product.images?.[0]?.url;
                    return (
                    <div
                      key={item.id}
                      className="flex gap-4 border rounded p-3 bg-gray-50"
                    >
                      {productImage && (
                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0">
                          <Image
                            src={productImage}
                            alt={item.product.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            £{item.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>
                    );
                  })}
                </div>

                {/* Cost Breakdown */}
                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>£{order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Discount</span>
                      <span>
                        -£{order.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery fee</span>
                    <span>£{order.shippingFee.toFixed(2)}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>£{order.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span>£{order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ORDER TRACKING - Desktop only */}
            <div className="hidden lg:block border rounded">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide bg-[#FAFAFA] border-b border-gray-200 p-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Order Tracking
              </h2>
              <div className="p-4">
                <OrderTimeline steps={timelineSteps} />
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Delivery Method & Tracking */}
            <div className="border rounded">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide bg-[#FAFAFA] border-b border-gray-200 p-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Delivery Details
              </h2>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">
                    Status
                  </span>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {order.status}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">
                    Occasion
                  </span>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {order.occasion || 'General'}
                  </p>
                </div>
              </div>
            </div>

            {/* RECIPIENT INFORMATION */}
            <div className="border rounded">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide bg-[#FAFAFA] border-b border-gray-200 p-3 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Recipient Information
              </h2>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">
                    Email address
                  </span>
                  <p className="text-sm text-gray-900 font-medium text-right">
                    {order.email}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs text-gray-500 font-medium">
                    Delivery address
                  </span>
                  <p className="text-sm text-gray-900 font-medium text-right">
                    {order.deliveryAddress.street}
                    <br />
                    {order.deliveryAddress.town && (
                      <>
                        {order.deliveryAddress.town}
                        <br />
                      </>
                    )}
                    {order.deliveryAddress.county && (
                      <>
                        {order.deliveryAddress.county}
                        <br />
                      </>
                    )}
                    {order.deliveryAddress.zip}
                  </p>
                </div>
                {order.specialMessage && (
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs text-gray-500 font-medium">
                      Special Message
                    </span>
                    <p className="text-sm text-gray-900 font-medium text-right max-w-xs">
                      {order.specialMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ORDER TRACKING - Mobile only */}
            <div className="block lg:hidden border rounded">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide bg-[#FAFAFA] border-b border-gray-200 p-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Order Tracking
              </h2>
              <div className="p-4">
                <OrderTimeline steps={timelineSteps} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
