"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/components/admin/forms/ProductForm";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  type?: "item" | "food" | "giftbox";
}

export default function CreateProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Import and call the getCategoriesAction
        const { getCategoriesAction } = await import("@/lib/actions/category.actions");
        const result = await getCategoriesAction();
        if (result.success) {
          setCategories(result.data || []);
        } else {
          toast.error("Failed to load categories");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      // TODO: Call createProductAction(data)
      // const result = await createProductAction(data);
      // if (!result.success) {
      //   throw new Error(result.error);
      // }
      console.log("Creating product:", data);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Product</h1>
          <p className="text-gray-600">Add a new product to your catalog</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <ProductForm
              categories={categories}
              onSubmit={handleSubmit}
              isEditing={false}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
