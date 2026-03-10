"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderCard } from "./OrderCard";

interface Order {
  id: string;
  orderNumber: string;
  status: "draft" | "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "failed";
  createdAt: Date;
  total: number;
  items: any[];
  currency?: string;
}

interface OrdersTabViewProps {
  orders: Order[];
}

export function OrdersTabView({ orders }: OrdersTabViewProps) {
  const [activeTab, setActiveTab] = useState("ongoing");

  // Filter orders into ongoing and history
  const ongoingStatuses = ["draft", "pending", "paid", "processing", "shipped"];
  const ongoingOrders = orders.filter((order) =>
    ongoingStatuses.includes(order.status)
  );
  const historyOrders = orders.filter((order) =>
    !ongoingStatuses.includes(order.status)
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Tabs - Full width on mobile, left sidebar on desktop */}
      <div className="w-full lg:w-auto lg:min-w-50">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-1 lg:h-auto">
            <TabsTrigger value="ongoing" className="lg:justify-start lg:w-full">
              <span>Ongoing</span>
              <span className="ml-2 font-semibold text-primary">
                {ongoingOrders.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="history" className="lg:justify-start lg:w-full">
              <span>History</span>
              <span className="ml-2 font-semibold text-primary">
                {historyOrders.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Orders Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="ongoing" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ongoingOrders.length > 0 ? (
              ongoingOrders.map((order: Order) => (
                <OrderCard
                  key={order.id}
                  id={order.id}
                  orderNumber={order.orderNumber}
                  status={order.status}
                  createdAt={order.createdAt}
                  total={order.total}
                  itemCount={order.items?.length || 0}
                  items={order.items}
                  currency={order.currency}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No ongoing orders</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {historyOrders.length > 0 ? (
              historyOrders.map((order: Order) => (
                <OrderCard
                  key={order.id}
                  id={order.id}
                  orderNumber={order.orderNumber}
                  status={order.status}
                  createdAt={order.createdAt}
                  total={order.total}
                  itemCount={order.items?.length || 0}
                  items={order.items}
                  currency={order.currency}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No order history</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
