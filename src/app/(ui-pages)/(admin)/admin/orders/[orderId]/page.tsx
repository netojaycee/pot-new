"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ShoppingCart, Printer, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: Array<{ url: string }>;
  };
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subtotal: number;
  tax: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  occasion?: string;
  specialMessage?: string;
  deliveryAddress: {
    street: string;
    town: string;
    zip: string;
    county: string;
  };
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  promoCode?: {
    code: string;
    type: "percent" | "fixed";
    value: number;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusChanging, setStatusChanging] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { getOrderAction } = await import("@/lib/actions/order.actions");
        const result = await getOrderAction(orderId);

        if (result.success && "data" in result) {
          setOrder(result.data);
          setNewStatus(result.data.status);
        } else {
          toast.error(result.error || "Failed to load order");
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) {
      toast.error("Please select a different status");
      return;
    }

    try {
      setStatusChanging(true);
      const { updateOrderStatusAction } = await import("@/lib/actions/order.actions");
      const result = await updateOrderStatusAction(orderId, newStatus);

      if (result.success) {
        toast.success("Order status updated successfully");
        // Set new status in local state
        setOrder({ ...order, status: newStatus as any });
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setStatusChanging(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    paid: { label: "Paid", color: "bg-blue-100 text-blue-800" },
    processing: { label: "Processing", color: "bg-blue-100 text-blue-800" },
    shipped: { label: "Shipped", color: "bg-orange-100 text-orange-800" },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-52" />
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Order Not Found</h1>
        </div>
      </div>
    );
  }

  const config = statusConfig[order.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-8 h-8" />
              Order #{order.orderNumber}
            </h1>
            <p className="text-gray-600 text-sm">
              Created {new Date(order.createdAt).toLocaleDateString()} at{" "}
              {new Date(order.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        {/* <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </div> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Current Status</p>
                  <Badge className={config?.color}>{config?.label}</Badge>
                </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Update Status</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Order Status</DialogTitle>
                      <DialogDescription>
                        Change the order status to track fulfillment progress
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        disabled={statusChanging || newStatus === order.status}
                        onClick={handleStatusUpdate}
                      >
                        {statusChanging ? "Updating..." : "Update Status"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 pb-4 border-b last:pb-0 last:border-0"
                  >
                    {item.product.images?.[0]?.url && (
                      <div className="w-20 h-20 rounded bg-gray-100 overflow-hidden shrink-0">
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        £{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>{order.firstName} {order.lastName}</strong>
                </p>
                <p>{order.deliveryAddress.street}</p>
                <p>
                  {order.deliveryAddress.town}, {order.deliveryAddress.county}
                </p>
                <p>{order.deliveryAddress.zip}</p>
              </div>
            </CardContent>
          </Card>

          {/* Gift Details / Package Curation */}
          {(order.occasion || order.specialMessage) && (
            <Card>
              <CardHeader>
                <CardTitle>Gift Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.occasion && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Occasion</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {order.occasion}
                    </p>
                  </div>
                )}
                {order.specialMessage && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Special Message</p>
                    <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded border border-gray-200">
                      {order.specialMessage}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{order.email}</p>
              </div>
              {order.phone && (
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-medium">{order.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>£{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount{order.promoCode ? ` (${order.promoCode.code})` : ""}</span>
                  <span>-£{order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>£{order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>£{order.shippingFee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>£{order.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Order Number</p>
                <p className="font-medium">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-gray-600">Order Date</p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <Badge className={`${config?.color} mt-1`}>
                  {config?.label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
