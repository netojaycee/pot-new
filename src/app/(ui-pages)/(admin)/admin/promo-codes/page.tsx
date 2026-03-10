"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, Plus, Edit2, Trash2, Search, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PromoCode {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder?: number;
  maxUses?: number;
  usedCount: number;
  expiry?: string;
  active: boolean;
  createdAt: string;
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Fetch promo codes
    const fetchPromoCodes = async () => {
      // TODO: Call getPromoCodesAction()
      setLoading(false);
    };
    fetchPromoCodes();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const handleDelete = async (id: string) => {
    try {
      // Call delete action
      toast.success("Promo code deleted");
    } catch (error) {
      toast.error("Failed to delete promo code");
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      // Call update action
      toast.success(
        active ? "Promo code activated" : "Promo code deactivated"
      );
    } catch (error) {
      toast.error("Failed to update promo code");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-8 h-8" />
            Promo Codes
          </h1>
          <p className="text-gray-600">Create and manage discount codes</p>
        </div>
        <Link href="/admin/promo-codes/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Promo Code
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search promo codes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Active Codes</p>
              <p className="text-3xl font-bold text-primary">
                {promoCodes.filter((p) => p.active).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Usage</p>
              <p className="text-3xl font-bold text-primary">
                {promoCodes.reduce((sum, p) => sum + p.usedCount, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Expired Codes</p>
              <p className="text-3xl font-bold text-primary">
                {promoCodes.filter(
                  (p) =>
                    p.expiry && new Date(p.expiry) < new Date()
                ).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promo Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Promo Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Tag className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium">No promo codes found</p>
              <p className="text-sm text-gray-500">
                Create your first promo code to get started
              </p>
              <Link href="/admin/promo-codes/create">
                <Button className="mt-4">Create Promo Code</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Code</th>
                    <th className="text-left py-3 px-4 font-semibold">Discount</th>
                    <th className="text-left py-3 px-4 font-semibold">Min Order</th>
                    <th className="text-left py-3 px-4 font-semibold">Usage</th>
                    <th className="text-left py-3 px-4 font-semibold">Expiry</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((promo) => (
                    <tr key={promo.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-3 py-1 rounded font-mono font-semibold">
                            {promo.code}
                          </code>
                          <button
                            onClick={() => handleCopyCode(promo.code)}
                            className="p-1 hover:bg-gray-100 rounded transition"
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium">
                        {promo.type === "percent"
                          ? `${promo.value}%`
                          : `£${promo.value.toFixed(2)}`}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {promo.minOrder
                          ? `£${promo.minOrder.toFixed(2)}`
                          : "None"}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {promo.maxUses
                          ? `${promo.usedCount} / ${promo.maxUses}`
                          : `${promo.usedCount} uses`}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {promo.expiry
                          ? new Date(promo.expiry) < new Date()
                            ? "Expired"
                            : new Date(promo.expiry).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className={
                            promo.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {promo.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/promo-codes/${promo.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Promo Code</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete this promo code?
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline">Cancel</Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(promo.id)}
                                >
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
