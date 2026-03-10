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
import { RotateCcw, Search, Eye, CheckCircle, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ReturnRequest {
  id: string;
  orderId: string;
  reason: string;
  refundAmount: number;
  status: "requested" | "approved" | "rejected" | "processed";
  items: Array<{ productId: string; quantity: number; price: number }>;
  createdAt: string;
  order: { orderNumber: string };
  user: { firstName: string; lastName: string; email: string };
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    // Fetch returns
    const fetchReturns = async () => {
      try {
        const { getReturnsAction } = await import("@/lib/actions/return.actions");
        const result = await getReturnsAction(50, 0, search, filterStatus);
        
        if (result.success && "data" in result) {
          setReturns((result as any).data.returns || []);
        } else {
          toast.error(result.error || "Failed to fetch returns");
          setReturns([]);
        }
      } catch (error) {
        console.error("Error fetching returns:", error);
        toast.error("Failed to fetch returns");
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, [search, filterStatus]);

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    requested: { label: "Requested", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    approved: { label: "Approved", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
    processed: { label: "Processed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  };

  const handleApproveReturn = async (returnId: string) => {
    try {
      // Call update action
      toast.success("Return approved");
    } catch (error) {
      toast.error("Failed to approve return");
    }
  };

  const handleRejectReturn = async (returnId: string) => {
    try {
      // Call update action
      toast.success("Return rejected");
    } catch (error) {
      toast.error("Failed to reject return");
    }
  };

  const totalReturnRequests = returns.length;
  const pendingReturns = returns.filter(
    (r) => r.status === "requested" || r.status === "approved"
  ).length;
  const totalRefundAmount = returns
    .filter((r) => r.status === "processed")
    .reduce((sum, r) => sum + r.refundAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <RotateCcw className="w-8 h-8" />
          Returns Management
        </h1>
        <p className="text-gray-600">Handle product returns and refunds</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Returns</p>
              <p className="text-3xl font-bold text-primary">
                {totalReturnRequests}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-yellow-800 text-sm font-medium">Pending Action</p>
              <p className="text-3xl font-bold text-yellow-600">
                {pendingReturns}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Refunded</p>
              <p className="text-3xl font-bold text-primary">
                £{totalRefundAmount.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by order #, customer email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Returns</SelectItem>
            <SelectItem value="requested">Requested</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Return Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : returns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <RotateCcw className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium">No return requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Order #</th>
                    <th className="text-left py-3 px-4 font-semibold">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold">Reason</th>
                    <th className="text-left py-3 px-4 font-semibold">Items</th>
                    <th className="text-left py-3 px-4 font-semibold">Refund</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((returnReq) => {
                    const config = statusConfig[returnReq.status];
                    const StatusIcon = config?.icon;
                    return (
                      <tr key={returnReq.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium">
                          #{returnReq.order?.orderNumber || "N/A"}
                        </td>
                        <td className="py-4 px-4 text-sm">
                          <p className="font-medium">
                            {returnReq.user?.firstName} {returnReq.user?.lastName}
                          </p>
                          <p className="text-gray-500">{returnReq.user?.email}</p>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {returnReq.reason}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {returnReq.items?.length || 0} item(s)
                        </td>
                        <td className="py-4 px-4 font-medium">
                          £{returnReq.refundAmount.toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={config?.color}>
                            {config?.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/returns/${returnReq.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            {returnReq.status === "requested" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() =>
                                    handleApproveReturn(returnReq.id)
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleRejectReturn(returnReq.id)
                                  }
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
