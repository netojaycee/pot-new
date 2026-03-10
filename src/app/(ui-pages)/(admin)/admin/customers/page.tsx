"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, Mail, Phone, Eye, Shield } from "lucide-react";
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
import { toast } from "sonner";
import { getAllCustomersAction } from "@/lib/actions/user.actions";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
  verified: boolean;
  createdAt: string;
  totalSpent: number;
  _count: { orders: number };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Fetch customers
    const fetchCustomers = async () => {
      try {
        const result = await getAllCustomersAction(50, 0, search);
        
        if (result.success && "data" in result) {
          setCustomers((result as any).data.customers || []);
        } else {
          toast.error(result.error || "Failed to fetch customers");
          setCustomers([]);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to fetch customers");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [search]);

  const handlePromoteToAdmin = async (userId: string) => {
    try {
      // Call action to promote user
      toast.success("User promoted to admin");
    } catch (error) {
      toast.error("Failed to promote user");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-8 h-8" />
          Customers
        </h1>
        <p className="text-gray-600">Manage customer accounts and information</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Customers</p>
              <p className="text-3xl font-bold text-primary">{customers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Verified Users</p>
              <p className="text-3xl font-bold text-primary">
                {customers.filter((c) => c.verified).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-primary">
                £
                {customers
                  .reduce((sum, c) => sum + c.totalSpent, 0)
                  .toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search customers by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium">No customers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold">Orders</th>
                    <th className="text-left py-3 px-4 font-semibold">Total Spent</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium">
                        {customer.firstName} {customer.lastName}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {customer.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {customer.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-medium">
                        {customer._count.orders}
                      </td>
                      <td className="py-4 px-4 font-medium">
                        £{customer.totalSpent.toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          {customer.verified && (
                            <Badge className="bg-green-100 text-green-800">
                              Verified
                            </Badge>
                          )}
                          {customer.role === "admin" && (
                            <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/customers/${customer.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {customer.role !== "admin" && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Shield className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Promote to Admin</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to promote this user to admin?
                                    They will have full administrative access.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline">Cancel</Button>
                                  <Button
                                    onClick={() =>
                                      handlePromoteToAdmin(customer.id)
                                    }
                                  >
                                    Promote
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
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
