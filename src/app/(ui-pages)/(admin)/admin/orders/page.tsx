"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Search, Eye, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  items: Array<{ quantity: number; product: { name: string } }>;
}

const ITEMS_PER_PAGE = 10;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Fetch orders
    const fetchOrders = async () => {
      try {
        const { getOrdersAction } = await import("@/lib/actions/order.actions");
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const result = await getOrdersAction(ITEMS_PER_PAGE, offset, search, filterStatus);
        
        if (result.success && "data" in result) {
          setOrders(result.data.orders || []);
          setTotal((result as any).data.total || 0);
        } else {
          toast.error(result.error || "Failed to fetch orders");
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [search, filterStatus, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    paid: { label: "Processing", color: "bg-blue-100 text-blue-800", icon: Clock },
    processing: { label: "Processing", color: "bg-blue-100 text-blue-800", icon: Clock },
    shipped: { label: "Shipped", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: AlertCircle },
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Call update action
      toast.success("Order status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-8 h-8" />
          Orders
        </h1>
        <p className="text-gray-600">Manage and fulfill customer orders</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by order #, email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); setCurrentPage(1); }}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Order #</th>
                    <th className="text-left py-3 px-4 font-semibold">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold">Items</th>
                    <th className="text-left py-3 px-4 font-semibold">Total</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const config = statusConfig[order.status];
                    const StatusIcon = config?.icon;
                    return (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium">#{order.orderNumber}</td>
                        <td className="py-4 px-4 text-sm">
                          <p className="font-medium">
                            {order.firstName} {order.lastName}
                          </p>
                          <p className="text-gray-500">{order.email}</p>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {order.items.length} item(s)
                        </td>
                        <td className="py-4 px-4 font-medium">£{order.total.toFixed(2)}</td>
                        <td className="py-4 px-4">
                          <Badge className={config?.color}>
                            {config?.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && orders.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} orders
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.ceil(total / ITEMS_PER_PAGE) }).map((_, i) => {
                    const pageNum = i + 1;
                    const isVisible =
                      pageNum === 1 ||
                      pageNum === Math.ceil(total / ITEMS_PER_PAGE) ||
                      Math.abs(pageNum - currentPage) <= 1;

                    if (!isVisible) {
                      if (i === 1) {
                        return (
                          <PaginationItem key="ellipsis">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          isActive={pageNum === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNum);
                          }}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < Math.ceil(total / ITEMS_PER_PAGE)) {
                          setCurrentPage(currentPage + 1);
                        }
                      }}
                      className={
                        currentPage >= Math.ceil(total / ITEMS_PER_PAGE)
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
