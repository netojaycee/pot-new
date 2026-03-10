"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Warehouse, Search, AlertTriangle, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { getProductsAction } from "@/lib/actions/product.actions";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  price: number;
  availableQuantity: number;
  soldCount: number;
  images: Array<{ url: string }>;
  lowStockThreshold?: number;
  lastRestocked?: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        
        const result = await getProductsAction({ 
          limit: 100,
          search: search || undefined 
        });
        
        if (result.success) {
          const inventoryItems = (result.data || []).map((product: any) => ({
            id: product.id,
            name: product.name,
            sku: product.sku || `SKU-${product.id.slice(0, 8)}`,
            price: product.price,
            availableQuantity: product.availableQuantity,
            soldCount: product.soldCount || 0,
            images: product.images || [],
            lowStockThreshold: 10,
          }));
          setItems(inventoryItems);
        } else {
          toast.error(result.error || "Failed to load inventory");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load inventory");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchInventory();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const isLowStock = (item: InventoryItem) => {
    return (
      item.availableQuantity <= (item.lowStockThreshold || 5)
    );
  };

  const totalInventoryValue = items.reduce((sum, item) => {
    return sum + item.price * item.availableQuantity;
  }, 0);

  const lowStockCount = items.filter(isLowStock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Warehouse className="w-8 h-8" />
          Inventory Management
        </h1>
        <p className="text-gray-600">Monitor stock levels and manage inventory</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Items</p>
              <p className="text-3xl font-bold text-primary">{items.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Stock Units</p>
              <p className="text-3xl font-bold text-primary">
                {items.reduce((sum, item) => sum + item.availableQuantity, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Inventory Value</p>
              <p className="text-3xl font-bold text-primary">
                £{totalInventoryValue.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-yellow-800 text-sm font-medium flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Low Stock
              </p>
              <p className="text-3xl font-bold text-yellow-600">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={filterLowStock ? "default" : "outline"}
          onClick={() => setFilterLowStock(!filterLowStock)}
          className="gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Low Stock Only
        </Button>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Warehouse className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium">No inventory items</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Product</th>
                    <th className="text-left py-3 px-4 font-semibold">SKU</th>
                    <th className="text-left py-3 px-4 font-semibold">Price</th>
                    <th className="text-left py-3 px-4 font-semibold">In Stock</th>
                    <th className="text-left py-3 px-4 font-semibold">Sold</th>
                    <th className="text-left py-3 px-4 font-semibold">Value</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const lowStock = isLowStock(item);
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {item.images?.[0]?.url && (
                              <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                                <Image
                                  src={item.images[0].url}
                                  alt={item.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <p className="font-medium">{item.name}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {item.sku || "-"}
                        </td>
                        <td className="py-4 px-4 font-medium">
                          £{item.price.toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`text-sm font-medium px-3 py-1 rounded-full ${
                              lowStock
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {item.availableQuantity}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {item.soldCount}
                        </td>
                        <td className="py-4 px-4 font-medium">
                          £{(item.price * item.availableQuantity).toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          {lowStock ? (
                            <Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">
                              In Stock
                            </Badge>
                          )}
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
