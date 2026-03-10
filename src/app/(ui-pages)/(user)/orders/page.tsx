import { getUserOrdersAction } from "@/lib/actions/order.actions";
import { OrdersTabView } from "@/components/orders/OrdersTabView";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  status: "draft" | "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "failed";
  createdAt: Date;
  total: number;
  items: any[];
  currency?: string;
}

export default async function AllOrdersPage() {
  const result = await getUserOrdersAction(50, 0);
  const orders = result.success ? ((result as any)?.data?.orders || []) : [];

  if (!result.success) {
    return (
      <div className="min-h-screen px-4 lg:px-16 py-8 bg-white">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        <div className="max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{result.error || "Failed to fetch orders"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen px-4 lg:px-16 py-8 bg-white">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        <div className="max-w-4xl">
          <div className="text-center py-16">
            <p className="text-gray-600 mb-6">You haven&apos;t placed any orders yet</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 lg:px-16 py-8 bg-white">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
      <OrdersTabView orders={orders} />
    </div>
  );
}
