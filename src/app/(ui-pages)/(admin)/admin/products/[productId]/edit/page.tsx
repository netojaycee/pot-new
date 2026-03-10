"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  availableQuantity: number;
  categoryId: string;
  type: "item" | "food" | "giftbox";
  sku?: string;
  lowStockThreshold?: number;
}

export default function EditProductPage() {
  const params = useParams();
  const productId = params.productId as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { getCategoryAction } = await import("@/lib/actions/category.actions");
        const { getCategoriesAction } = await import("@/lib/actions/category.actions");
        const { getProductAction } = await import("@/lib/actions/product.actions");

        // Fetch the product
        const productResult = await getProductAction(productId);
        if (productResult.success) {
          setProduct(productResult.data);
        }

        // Fetch all categories
        const categoriesResult = await getCategoriesAction();
        if (categoriesResult.success) {
          setCategories(categoriesResult.data || []);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load product or categories");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId]);

  const handleSubmit = async (data: any) => {
    try {
      // TODO: Call updateProductAction(productId, data)
      // const result = await updateProductAction(productId, data);
      // if (!result.success) {
      //   throw new Error(result.error);
      // }
      console.log("Updating product:", productId, data);
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
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="text-gray-600">Update product information</p>
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
          ) : product ? (
            <ProductForm
              initialData={product}
              categories={categories}
              onSubmit={handleSubmit}
              isEditing={true}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Product not found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
