"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Plus, Edit2, Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getCategoriesAction, deleteCategoryAction } from "@/lib/actions/category.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Category {
  id: string;
  name: string;
  description?: string;
  type: "item" | "food" | "giftbox";
  productCount: number;
  parent?: { name: string };
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const result = await getCategoriesAction({ limit: ITEMS_PER_PAGE, offset });
        if (result.success) {
          // Filter by search if needed (client-side search for now)
          let filtered = result.data || [];
          if (search) {
            filtered = filtered.filter((cat: any) =>
              cat.name.toLowerCase().includes(search.toLowerCase())
            );
          }
          setCategories(filtered);
          setTotal(filtered.length);
        } else {
          toast.error(result.error || "Failed to load categories");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchCategories();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page on search
  };
  

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const result = await deleteCategoryAction(id);

      if (result.success) {
        setCategories(categories.filter(c => c.id !== id));
        setTotal(total - 1);
        toast.success("Category deleted successfully");
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to delete category");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  const typeConfig: Record<string, string> = {
    item: "Product",
    food: "Food",
    giftbox: "Gift Box",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-8 h-8" />
            Categories
          </h1>
          <p className="text-gray-600">Manage product categories</p>
        </div>
        <Link href="/admin/categories/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Categories</p>
              <p className="text-3xl font-bold text-primary">
                {categories.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Products</p>
              <p className="text-3xl font-bold text-primary">
                {categories.reduce((sum, c) => sum + c.productCount, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Avg Products/Category</p>
              <p className="text-3xl font-bold text-primary">
                {categories.length > 0
                  ? Math.round(
                      categories.reduce((sum, c) => sum + c.productCount, 0) /
                        categories.length
                    )
                  : 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Zap className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium">No categories found</p>
              <p className="text-sm text-gray-500">
                Create your first category to get started
              </p>
              <Link href="/admin/categories/create">
                <Button className="mt-4">Create Category</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Parent Category
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Products
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium">{category.name}</td>
                      <td className="py-4 px-4">
                        <Badge variant="outline">
                          {typeConfig[category.type]}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {category.parent?.name || "-"}
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {category.productCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/categories/${category.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Dialog open={isDialogOpen && deletingId === category.id} onOpenChange={setIsDialogOpen}>
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
                                <DialogTitle>Delete Category</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete this category?
                                  This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button 
                                  variant="outline"
                                  onClick={() => setIsDialogOpen(false)}
                                  disabled={deletingId === category.id}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(category.id)}
                                  disabled={deletingId === category.id}
                                >
                                  {deletingId === category.id ? "Deleting..." : "Delete"}
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

          {/* Pagination */}
          {!loading && categories.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} categories
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
