"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryForm } from "@/components/admin/forms/CategoryForm";
import { getCategoryAction, getCategoriesAction } from "@/lib/actions/category.actions";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  type?: "item" | "food" | "giftbox";
  description?: string;
  parentId?: string | null;
}

interface FormData {
  name: string;
  parentId?: string | null;
  type?: string;
}

export default function EditCategoryPage() {
  const params = useParams();
  const categoryId = params?.categoryId as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch the category to edit
        const categoryResult = await getCategoryAction(categoryId);
        if (categoryResult.success) {
          setCategory(categoryResult.data);
        } else {
          toast.error(categoryResult.error || "Failed to load category");
          return;
        }

        // Fetch all other categories (for parent selection)
        const categoriesResult = await getCategoriesAction();
        if (categoriesResult.success) {
          // Filter out the current category
          const filtered = (categoriesResult.data || []).filter(
            (c: any) => c.id !== categoryId
          );
          setCategories(filtered);
        } else {
          toast.error("Failed to load categories");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load category data");
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchData();
    }
  }, [categoryId]);

  const handleSubmit = async (data: FormData) => {
    try {
      // TODO: Call updateCategoryAction(categoryId, data)
      console.log("Updating category:", categoryId, data);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  if (!categoryId) return <div>Invalid category ID</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/categories">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Category</h1>
          <p className="text-gray-600">Update category details</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : category ? (
            <CategoryForm
              categories={categories}
              onSubmit={handleSubmit}
              isEditing={true}
              initialData={category as any}
            />
          ) : (
            <div>Category not found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
